import { create } from 'zustand';

interface EmergencyAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
}

interface EmergencyState {
  emergencyActive: boolean;
  activeAlerts: EmergencyAlert[];
  currentAlert: EmergencyAlert | null;
  setEmergencyActive: (active: boolean) => void;
  setActiveAlerts: (alerts: EmergencyAlert[]) => void;
  setCurrentAlert: (alert: EmergencyAlert | null) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  emergencyActive: false,
  activeAlerts: [],
  currentAlert: null,
  setEmergencyActive: (active) => set({ emergencyActive: active }),
  setActiveAlerts: (alerts) => set({ activeAlerts: alerts, emergencyActive: alerts.length > 0 }),
  setCurrentAlert: (alert) => set({ currentAlert: alert }),
}));
