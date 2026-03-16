import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { fetchWithCache, invalidateCache } from '../../services/api';

const toQueryString = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    qs.append(key, String(value));
  });
  return qs.toString();
};

export const useAdminSectionData = ({ endpoint, params = {}, cachePrefix, ttlMs = 30000 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const queryString = useMemo(() => toQueryString(params), [params]);
  const cacheKey = `${cachePrefix}-${queryString}`;

  const refetch = useCallback(() => {
    invalidateCache(`${cachePrefix}-`);
    setReloadKey((prev) => prev + 1);
  }, [cachePrefix]);

  useEffect(() => {
    const controller = new AbortController();

    fetchWithCache(
      cacheKey,
      async () => {
        const response = await api.get(endpoint, { params, signal: controller.signal });
        return response.data?.data || null;
      },
      ttlMs
    )
      .then((responseData) => {
        setData(responseData);
        setError('');
      })
      .catch((requestError) => {
        if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
          setError(requestError?.response?.data?.message || requestError.message || 'Failed to load section data');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [cacheKey, endpoint, params, reloadKey, ttlMs]);

  return { data, loading, error, refetch };
};
