import type { Citizen } from '../types';
import { CITIZENS } from '../data/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const citizenService = {
  async getAll(): Promise<Citizen[]> {
    await delay(400);
    return [...CITIZENS];
  },

  async getById(id: string): Promise<Citizen | undefined> {
    await delay(200);
    return CITIZENS.find(c => c.id === id);
  },

  async search(query: string): Promise<Citizen[]> {
    await delay(300);
    const q = query.toLowerCase();
    return CITIZENS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.citizenId.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  },

  async create(data: Omit<Citizen, 'id' | 'citizenId' | 'registeredAt' | 'grievancesCount' | 'applicationsCount'>): Promise<Citizen> {
    await delay(700);
    const exists = CITIZENS.find(c => c.email === data.email || c.aadhaar === data.aadhaar);
    if (exists) throw new Error('Citizen with this email or Aadhaar already exists');

    return {
      id: `c${Date.now()}`,
      citizenId: `CTZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      ...data,
      registeredAt: new Date().toISOString().split('T')[0],
      grievancesCount: 0,
      applicationsCount: 0,
    };
  },

  async updateStatus(citizen: Citizen, status: Citizen['status']): Promise<Citizen> {
    await delay(300);
    return { ...citizen, status };
  },

  async getStats(): Promise<{ total: number; active: number; inactive: number; suspended: number }> {
    await delay(200);
    return {
      total: CITIZENS.length,
      active: CITIZENS.filter(c => c.status === 'active').length,
      inactive: CITIZENS.filter(c => c.status === 'inactive').length,
      suspended: CITIZENS.filter(c => c.status === 'suspended').length,
    };
  },
};

export default citizenService;
