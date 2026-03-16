import { useCallback, useEffect, useState } from 'react';
import api, { fetchWithCache, invalidateCache } from '../../services/api';

export const useAdminStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    invalidateCache('admin-overview-stats');
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const responseData = await fetchWithCache(
          'admin-overview-stats',
          async () => {
            const response = await api.get('/admin/overview-stats', { signal: controller.signal });
            return response.data?.data || null;
          },
          30000
        );
        setData(responseData);
      } catch (requestError) {
        if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
          setError(requestError?.response?.data?.message || requestError.message || 'Failed to load stats');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [reloadKey]);

  return { data, loading, error, refetch };
};
