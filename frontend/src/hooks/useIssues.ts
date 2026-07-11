'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useIssues(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['issues', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/issues?${params.toString()}`);
      return data.data;
    },
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: async () => { const { data } = await api.get(`/issues/${id}`); return data.data; },
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => { const { data } = await api.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return data.data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues'] }),
  });
}

export function useNearbyIssues(lat: number, lng: number, radius = 5000) {
  return useQuery({
    queryKey: ['issues', 'nearby', lat, lng, radius],
    queryFn: async () => { const { data } = await api.get(`/gis/nearby?lat=${lat}&lng=${lng}&radius=${radius}`); return data.data; },
    enabled: !!lat && !!lng,
  });
}
