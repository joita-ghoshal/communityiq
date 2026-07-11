import GeofenceAlert from '@/components/emergency/GeofenceAlert';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GeofenceAlert />
    </>
  );
}
