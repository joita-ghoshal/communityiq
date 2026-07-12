'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNotificationStore } from '@/stores/notification.store';

export function useNotifications() {
  const { setNotifications } = useNotificationStore();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const { data } = await api.get('/notifications'); return data.data?.data || data.data || []; },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data) setNotifications(data);
  }, [data, setNotifications]);

  return data || [];
}
