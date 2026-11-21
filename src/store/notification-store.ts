import { create } from 'zustand';
import api from '@/lib/api';
import type { Notification } from '@/types';

interface NotificationState {
  items: Notification[];
  loading: boolean;
  /** Set when the last fetch failed, so the list can say so instead of "nothing new". */
  error: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

/** The API sends snake_case and lower-case types; the screens read this shape. */
export function toNotification(r: Record<string, unknown>): Notification {
  return {
    id: String(r.id),
    userId: String(r.user_id ?? r.userId ?? ''),
    stationId: (r.station_id ?? r.stationId) as string | undefined,
    type: (r.type as Notification['type']) ?? 'INFO',
    title: String(r.title ?? ''),
    message: String(r.message ?? ''),
    isRead: Boolean(r.is_read ?? r.isRead),
    createdAt: String(r.created_at ?? r.createdAt ?? ''),
  };
}

/** The latest notifications, shared by the top bar's alerts and the sidebar's count. */
export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  loading: false,
  error: false,
  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/notifications', { params: { limit: 10 } });
      const payload = res.data as { data?: Record<string, unknown>[] } | Record<string, unknown>[];
      const rows = Array.isArray(payload) ? payload : (payload.data ?? []);
      set({ items: rows.map(toNotification), loading: false, error: false });
    } catch {
      set({ loading: false, error: true });
    }
  },
  markRead: async (id) => {
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // The next fetch shows the true state; a failed mark is not worth an error here.
    }
  },
}));

export const unreadCount = (items: Notification[]) => items.filter((n) => !n.isRead).length;
