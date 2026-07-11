'use client';
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useUIStore } from '@/stores/ui.store';
import { useEmergencyStore } from '@/stores/emergency.store';
import EmergencyAlertBanner from '@/components/emergency/EmergencyAlertBanner';

interface AppShellProps { children: ReactNode; }

export default function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useUIStore();
  const { emergencyActive } = useEmergencyStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
        <Header />
        {emergencyActive && <EmergencyAlertBanner />}
        <main className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
