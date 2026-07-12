'use client';
import { useAuth } from '@/hooks/useAuth';
import GeofenceAlert from '@/components/emergency/GeofenceAlert';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuth(true);

  return (
    <>
      {children}
      <GeofenceAlert />
    </>
  );
}
