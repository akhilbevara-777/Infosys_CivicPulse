import { create } from 'zustand';
import type { AppNotification } from '../types';
import { notificationApi } from '../api/notificationApi';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;

  load: (citizenId: string) => Promise<void>;
  refresh: (citizenId: string) => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: (citizenId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  load: async (citizenId) => {
    set({ loading: true });
    try {
      const [notifications, unreadCount] = await Promise.all([
        notificationApi.getAll(citizenId),
        notificationApi.getUnreadCount(citizenId),
      ]);
      set({ notifications, unreadCount, loading: false });
    } catch { set({ loading: false }); }
  },

  // Silent refresh for polling
  refresh: async (citizenId) => {
    try {
      const [notifications, unreadCount] = await Promise.all([
        notificationApi.getAll(citizenId),
        notificationApi.getUnreadCount(citizenId),
      ]);
      set({ notifications, unreadCount });
    } catch { /* silent */ }
  },

  markRead: async (notificationId) => {
    await notificationApi.markRead(notificationId);
    set(state => ({
      notifications: state.notifications.map(n =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async (citizenId) => {
    await notificationApi.markAllRead(citizenId);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
