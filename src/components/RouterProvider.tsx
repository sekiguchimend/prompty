"use client";

import React from 'react';

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // In Next.js, we don't need an actual router
  // Just returning children directly
  return <>{children}</>;
} 