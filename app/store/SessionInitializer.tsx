'use client';

import { useRef } from 'react';
import { useSessionStore, UserSession } from '@/app/store/session';

export default function SessionInitializer({ user }: { user: UserSession | null }) {
  const initialized = useRef(false);
  
  if (!initialized.current) {
    useSessionStore.setState({ user });
    initialized.current = true;
  }

  return null;
}