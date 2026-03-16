import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { fetchWithCache, invalidateCache } from '../../services/api';

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    search.append(key, String(value));
  });
  return search.toString();
};

export const useAchievementsSection = (params) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const queryString = useMemo(() => buildQuery(params), [params]);
  const cacheKey = `admin-achievements-${queryString}`;

  const refetch = useCallback(() => {
    invalidateCache('admin-achievements-');
    setReloadKey((prev) => prev + 1);
  }, []);

  const updateStatus = useCallback(async ({ achievementId, status, reason }) => {
    await api.patch(`/admin/sections/achievements/${achievementId}/status`, { status, reason });
    invalidateCache('admin-achievements-');
    setReloadKey((prev) => prev + 1);
  }, []);

  const bulkUpdateStatus = useCallback(async ({ achievementIds, status, reason }) => {
    await api.patch('/admin/sections/achievements/status/bulk', {
      achievementIds,
      status,
      reason
    });
    invalidateCache('admin-achievements-');
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchWithCache(
      cacheKey,
      async () => {
        const response = await api.get('/admin/sections/achievements', {
          params,
          signal: controller.signal
        });
        return response.data?.data || null;
      },
      30000
    )
      .then((responseData) => {
        setData(responseData);
        setError('');
      })
      .catch((requestError) => {
        if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
          setError(requestError?.response?.data?.message || requestError.message || 'Failed to load achievements');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [cacheKey, params, reloadKey]);

  return { data, loading, error, refetch, updateStatus, bulkUpdateStatus };
};
