import { api } from './client';
import type { Citizen } from '../types';
import { CITIZENS } from '../data/mockData';

const EP = '/api/citizens';

export const citizenApi = {
  async getAll(search?: string): Promise<Citizen[]> {
    try {
      const res = await api.get(EP, { params: search ? { search } : {} });
      return res.data;
    } catch (e: any) {
      if (e?.offline) return search
        ? CITIZENS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : [...CITIZENS];
      throw e;
    }
  },

  async getById(id: string): Promise<Citizen> {
    try {
      const res = await api.get(`${EP}/${id}`);
      return res.data;
    } catch (e: any) {
      if (e?.offline) return CITIZENS.find(c => c.id === id) ?? CITIZENS[0];
      throw e;
    }
  },

  async create(data: Omit<Citizen, 'id' | 'citizenId' | 'registeredAt' | 'grievancesCount' | 'applicationsCount'>): Promise<Citizen> {
    try {
      const res = await api.post(EP, data);
      return res.data;
    } catch (e: any) {
      if (e?.offline) return {
        id: `c${Date.now()}`,
        citizenId: `CTZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        ...data,
        status: 'active',
        registeredAt: new Date().toISOString().split('T')[0],
        grievancesCount: 0,
        applicationsCount: 0,
      } as Citizen;
      throw e;
    }
  },

  async updateStatus(id: string, status: Citizen['status']): Promise<Citizen> {
    try {
      const res = await api.patch(`${EP}/${id}/status`, null, { params: { status: status.toUpperCase() } });
      return res.data;
    } catch (e: any) {
      if (e?.offline) {
        const c = CITIZENS.find(c => c.id === id)!;
        return { ...c, status };
      }
      throw e;
    }
  },

  async getStats() {
    try {
      const res = await api.get(`${EP}/stats`);
      return res.data;
    } catch (e: any) {
      if (e?.offline) return {
        total: CITIZENS.length,
        active: CITIZENS.filter(c => c.status === 'active').length,
        inactive: CITIZENS.filter(c => c.status === 'inactive').length,
        suspended: CITIZENS.filter(c => c.status === 'suspended').length,
      };
      throw e;
    }
  },
};
