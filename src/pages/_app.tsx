// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth-context';

function MyApp({ Component, pageProps, router }: AppProps) {
  // アプリの初期化時とルート変更時にログを出力
 
  
  return (
    <>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

export default MyApp;