// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth-context';
import { useEffect, useState } from 'react';

function MyApp({ Component, pageProps, router }: AppProps) {
  // クライアントサイドでのみレンダリングするために使用
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // サーバーサイドレンダリング時は何も表示しない
  if (!isMounted) {
    return null;
  }
  
  return (
    <>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

export default MyApp;