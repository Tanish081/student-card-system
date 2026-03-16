import { useCallback, useEffect, useState } from 'react';
import api, { fetchWithCache, invalidateCache } from '../../services/api';

export const useSchoolsSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    invalidateCache('admin-schools');
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchWithCache(
      'admin-schools',
      async () => {
        const response = await api.get('/admin/sections/schools', { signal: controller.signal });
        return response.data?.data || null;
      },
      60000
    )
      .then((responseData) => {
        setData(responseData);
        setError('');
      })
      .catch((requestError) => {
        if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
          setError(requestError?.response?.data?.message || requestError.message || 'Failed to load schools');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  return { data, loading, error, refetch };
};
