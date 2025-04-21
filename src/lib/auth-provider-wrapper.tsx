'use client';

import React from 'react';
import { AuthProvider } from './auth-context';

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return <AuthProvider>{children}</AuthProvider>;
} 