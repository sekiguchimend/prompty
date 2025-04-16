"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import '../src/index.css';

// Dynamically import the HomePage component with SSR enabled but use suspense to handle hydration issues
const HomePage = dynamic(() => import('../src/components/HomePage'), {
  ssr: true,
  loading: () => <div className="h-screen flex items-center justify-center">Loading...</div>
});

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <HomePage />
    </Suspense>
  );
} 