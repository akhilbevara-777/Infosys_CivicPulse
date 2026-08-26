import { MOCK_USERS } from '../data/mockData';
import { api } from '../api/client';
import type { User } from '../types';

export interface LoginCredentials { email: string; password: string; }
export interface SignupData {
  name: string; email: string; password: string;
  phone: string; ward: string; address: string; aadhaar: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Map backend citizen profile → User type */
function citizenToUser(c: any): User {
  return {
    id:          c.id,
    name:        c.name,
    email:       c.email,
    role:        'citizen',
    phone:       c.phone,
    ward:        c.ward,
    address:     c.address,
    city:        c.city,
    district:    c.district,
    state:       c.state,
    pincode:     c.pincode,
    avatar:      c.avatarUrl,
    createdAt:   c.registeredAt ?? c.createdAt ?? '',
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    // Try backend login endpoint first
    try {
      const res = await api.post('/api/citizens/login', credentials, { timeout: 5000 });
      if (res.data?.id) {
        return citizenToUser(res.data);
      }
    } catch (e: any) {
      // 401 = wrong credentials — throw immediately, don't fall through
      if (e?.response?.status === 401) {
        throw new Error(e.response.data?.error ?? 'Invalid email or password');
      }
      // Backend offline — fall through to mock
      if (!e?.offline && e?.code !== 'ERR_NETWORK' && e?.code !== 'ECONNREFUSED') {
        throw new Error(e?.response?.data?.error ?? e?.message ?? 'Login failed');
      }
    }

    // Fallback: backend offline — use mock users (admin / officer / commissioner / demo citizen)
    await delay(300);
    const found = MOCK_USERS.find(u => u.email === credentials.email && u.password === credentials.password);
    if (!found) throw new Error('Invalid email or password');
    const { password: _, ...user } = found;
    return user as User;
  },

  async signup(data: SignupData): Promise<User> {
    // Try real backend — send password in aadhaarHash field so backend hashes & stores it
    try {
      const payload = {
        name:        data.name,
        email:       data.email,
        phone:       data.phone,
        ward:        data.ward,
        address:     data.address,
        aadhaarHash: data.password,   // backend stores as "PWD:<sha256>"
      };
      const res = await api.post('/api/citizens', payload, { timeout: 8000 });
      return citizenToUser(res.data);
    } catch (e: any) {
      if (e?.offline || e?.code === 'ECONNREFUSED' || e?.code === 'ERR_NETWORK') {
        // Offline fallback
        await delay(500);
        const exists = MOCK_USERS.find(u => u.email === data.email);
        if (exists) throw new Error('An account with this email already exists');
        return {
          id:        `c${Date.now()}`,
          name:      data.name,
          email:     data.email,
          role:      'citizen',
          phone:     data.phone,
          ward:      data.ward,
          address:   data.address,
          createdAt: new Date().toISOString().split('T')[0],
        };
      }
      const msg = e?.response?.data?.error ?? e?.message ?? 'Registration failed';
      throw new Error(msg);
    }
  },
};
