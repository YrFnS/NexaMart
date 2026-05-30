'use client';

import { create } from 'zustand';
import { LS_KEYS } from '@/lib/config';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'admin';
  loyaltyTier: string;
  loyaltyPoints: number;
  walletBalance: number;
  aiCredits: number;
  isVerified: boolean;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

function loadUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LS_KEYS.user);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) return parsed;
    }
  } catch {
    // localStorage not available or invalid data
  }
  return null;
}

function saveUser(user: User | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(LS_KEYS.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(LS_KEYS.user);
    }
  } catch {
    // localStorage not available
  }
}

export const useUserStore = create<UserState>((set) => ({
  user: loadUser(),

  setUser: (user) => {
    saveUser(user);
    set({ user });
  },
}));
