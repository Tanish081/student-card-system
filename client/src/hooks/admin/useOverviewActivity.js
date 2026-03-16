import { useCallback, useEffect, useState } from 'react';
import api, { fetchWithCache, invalidateCache } from '../../services/api';

export const useOverviewActivity = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    invalidateCache('admin-overview-activity');
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchWithCache(
          'admin-overview-activity',
          async () => {
            const response = await api.get('/admin/overview-activity', {
              params: { limit: 5 },
              signal: controller.signal
            });
            return response.data?.data?.items || [];
          },
          30000
        );
        setItems(data);
      } catch (requestError) {
        if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
          setError(requestError?.response?.data?.message || requestError.message || 'Failed to load activity');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [reloadKey]);

  return { items, loading, error, refetch };
};
