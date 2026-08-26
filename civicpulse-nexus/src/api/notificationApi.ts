import { api } from './client';
import type { AppNotification } from '../types';

const EP = '/api/notifications';

function fromBackend(n: any): AppNotification {
  return {
    ...n,
    type:      n.type as AppNotification['type'],
    isRead:    n.isRead ?? n.read ?? false,
    createdAt: n.createdAt?.toString() ?? '',
    relatedEntityType: n.relatedEntityType ?? undefined,
  };
}

export const notificationApi = {
  async getAll(citizenId: string): Promise<AppNotification[]> {
    try {
      const res = await api.get(EP, { params: { citizenId } });
      return (res.data as any[]).map(fromBackend);
    } catch (e: any) {
      if (e?.offline) return [];
      throw e;
    }
  },

  async getUnreadCount(citizenId: string): Promise<number> {
    try {
      const res = await api.get(`${EP}/unread-count`, { params: { citizenId } });
      return res.data?.count ?? 0;
    } catch {
      return 0;
    }
  },

  async markRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`${EP}/${notificationId}/read`);
    } catch { /* offline ok */ }
  },

  async markAllRead(citizenId: string): Promise<void> {
    try {
      await api.patch(`${EP}/read-all`, null, { params: { citizenId } });
    } catch { /* offline ok */ }
  },
};
