import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { profileApi, type ProfileUpdateData, type PasswordChangeData } from '../api/profileApi';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  profileLoading: boolean;
  profileError: string | null;

  login:          (user: User) => void;
  logout:         () => void;
  updateUser:     (updates: Partial<User>) => void;
  loadProfile:    (citizenId: string) => Promise<void>;
  updateProfile:  (citizenId: string, data: ProfileUpdateData) => Promise<void>;
  changePassword: (citizenId: string, data: PasswordChangeData) => Promise<void>;
  uploadAvatar:   (citizenId: string, file: File) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:           null,
      isAuthenticated:false,
      profileLoading: false,
      profileError:   null,

      login:  (user) => set({ user, isAuthenticated: true }),
      logout: ()     => set({ user: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      /** Fetch fresh profile from backend and merge into user */
      loadProfile: async (citizenId) => {
        // Skip load for non-UUID mock IDs (admin/officer/commissioner)
        if (!citizenId || citizenId.startsWith('u') || citizenId.length < 10) {
          set({ profileLoading: false });
          return;
        }
        set({ profileLoading: true, profileError: null });
        try {
          const data = await profileApi.getProfile(citizenId);
          set(state => ({
            user: state.user ? { ...state.user, ...data } : null,
            profileLoading: false,
          }));
        } catch (e) {
          // Non-fatal — user still logged in, just profile not enriched from DB
          set({ profileLoading: false });
        }
      },

      updateProfile: async (citizenId, data) => {
        set({ profileLoading: true, profileError: null });
        try {
          const updated = await profileApi.updateProfile(citizenId, data);
          set(state => ({
            user: state.user ? { ...state.user, ...updated } : null,
            profileLoading: false,
          }));
        } catch (e) {
          set({ profileLoading: false, profileError: String(e) });
          throw e;
        }
      },

      changePassword: async (citizenId, data) => {
        set({ profileLoading: true, profileError: null });
        try {
          await profileApi.changePassword(citizenId, data);
          set({ profileLoading: false });
        } catch (e) {
          set({ profileLoading: false, profileError: String(e) });
          throw e;
        }
      },

      uploadAvatar: async (citizenId, file) => {
        set({ profileLoading: true, profileError: null });
        try {
          const updated = await profileApi.uploadAvatar(citizenId, file);
          set(state => ({
            user: state.user ? { ...state.user, ...updated } : null,
            profileLoading: false,
          }));
        } catch (e) {
          set({ profileLoading: false, profileError: String(e) });
          throw e;
        }
      },
    }),
    {
      name: 'civicpulse-auth',
      // Only persist non-sensitive fields
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
