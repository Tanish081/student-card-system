import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { fetchWithCache, invalidateCache } from '../../services/api';

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, String(value));
  });
  return query.toString();
};

export const useStudentsSection = (params) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const queryString = useMemo(() => buildQueryString(params), [params]);
  const cacheKey = `admin-students-${queryString}`;

  const refetch = useCallback(() => {
    invalidateCache('admin-students-');
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const responseData = await fetchWithCache(
          cacheKey,
          async () => {
            const response = await api.get('/admin/sections/students', {
              params,
              signal: controller.signal
            });
            return response.data?.data || null;
          },
          60000
        );
        setData(responseData);
      } catch (requestError) {
        if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
          setError(requestError?.response?.data?.message || requestError.message || 'Failed to load students');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [cacheKey, params, reloadKey]);

  return { data, loading, error, refetch };
};

export const useStudentDetail = (uid) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!uid) return;
    const cacheKey = `admin-student-${uid}`;
    invalidateCache(cacheKey);

    const controller = new AbortController();
    setLoading(true);
    setError('');
    try {
      const responseData = await fetchWithCache(
        cacheKey,
        async () => {
          const response = await api.get(`/admin/sections/students/${uid}`, {
            signal: controller.signal
          });
          return response.data?.data || null;
        },
        60000
      );
      setData(responseData);
    } catch (requestError) {
      if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
        setError(requestError?.response?.data?.message || requestError.message || 'Failed to load student details');
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchWithCache(
      `admin-student-${uid}`,
      async () => {
        const response = await api.get(`/admin/sections/students/${uid}`, {
          signal: controller.signal
        });
        return response.data?.data || null;
      },
      60000
    )
      .then((responseData) => {
        setData(responseData);
      })
      .catch((requestError) => {
        if (requestError.name !== 'CanceledError' && requestError.name !== 'AbortError') {
          setError(requestError?.response?.data?.message || requestError.message || 'Failed to load student details');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [uid]);

  return { data, loading, error, refetch };
};
