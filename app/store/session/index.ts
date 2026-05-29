import { create } from 'zustand'
import { UserSession, SessionState } from '@/app/store/session/types'

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export type { UserSession }