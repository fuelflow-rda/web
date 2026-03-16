import { create } from 'zustand';
import api from '@/lib/api';
import type { Station } from '@/types';

interface StationState {
  stations: Station[];
  currentStation: Station | null;
  loading: boolean;

  fetchStations: () => Promise<void>;
  setCurrentStation: (station: Station) => void;
  setCurrentStationById: (id: string) => void;
}

export const useStationStore = create<StationState>((set, get) => ({
  stations: [],
  currentStation: null,
  loading: false,

  fetchStations: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/stations');
      const payload = response.data as { data?: unknown[] };
      const raw = payload?.data ?? (Array.isArray(response.data) ? response.data : []);
      const stations: Station[] = raw.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        companyId: (s.company_id as string) ?? '',
        name: (s.name as string) ?? '',
        location: (s.location as string) ?? '',
        isActive: true,
        createdAt: (s.created_at as string) ?? '',
        updatedAt: (s.updated_at as string) ?? '',
      }));
      set({ stations, loading: false });
      if (!get().currentStation && stations.length > 0) {
        set({ currentStation: stations[0] });
      }
    } catch {
      set({ loading: false });
    }
  },

  setCurrentStation: (station: Station) => {
    set({ currentStation: station });
  },

  setCurrentStationById: (id: string) => {
    const station = get().stations.find((s) => s.id === id);
    if (station) {
      set({ currentStation: station });
    }
  },
}));
