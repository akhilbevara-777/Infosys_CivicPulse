import { api } from './client';
import type { User } from '../types';

const EP = '/api/citizens';

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  ward?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

function fromBackend(d: any): Partial<User> {
  return {
    id:          d.id,
    name:        d.name,
    email:       d.email,
    phone:       d.phone,
    gender:      d.gender,
    dateOfBirth: d.dateOfBirth,
    address:     d.address,
    city:        d.city,
    district:    d.district,
    state:       d.state,
    pincode:     d.pincode,
    ward:        d.ward,
    avatar:      d.avatarUrl,
    createdAt:   d.registeredAt ?? d.createdAt ?? '',
  };
}

export const profileApi = {
  async getProfile(citizenId: string): Promise<Partial<User>> {
    try {
      const res = await api.get(`${EP}/${citizenId}/profile`);
      return fromBackend(res.data);
    } catch (e: any) {
      // 404 means citizen not in DB yet (mock user) — return empty, not an error
      if (e?.response?.status === 404 || e?.offline) return {};
      throw e;
    }
  },

  async updateProfile(citizenId: string, data: ProfileUpdateData): Promise<Partial<User>> {
    try {
      const res = await api.put(`${EP}/${citizenId}/profile`, data);
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) {
        // Return the data as-is for optimistic update
        return data as Partial<User>;
      }
      const msg = e?.response?.data?.error ?? e?.message ?? 'Profile update failed';
      throw new Error(msg);
    }
  },

  async changePassword(citizenId: string, data: PasswordChangeData): Promise<void> {
    try {
      await api.post(`${EP}/${citizenId}/change-password`, data);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Password change failed';
      throw new Error(msg);
    }
  },

  async uploadAvatar(citizenId: string, file: File): Promise<Partial<User>> {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`${EP}/${citizenId}/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return fromBackend(res.data);
    } catch (e: any) {
      if (e?.offline) throw new Error('Cannot upload avatar while offline');
      const msg = e?.response?.data?.error ?? e?.message ?? 'Avatar upload failed';
      throw new Error(msg);
    }
  },
};
