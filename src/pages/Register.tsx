"use client";

import React, { useState } from 'react';
import { Mail, Apple, X, AlertCircle, Github } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// モーダルとフォーム用のコンポーネント
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`border rounded px-3 py-2 w-full ${className}`} {...props} />
);

const FormItem = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

const FormLabel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={`block mb-1 ${className}`}>{children}</label>
);

const Register = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // メールでの登録処理
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードは必須です');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'サインアップに失敗しました');
      }

      // サインアップ成功
      setIsModalOpen(false);
      // プロフィール設定ページに遷移
      router.push('/setup-profile');
    } catch (err) {
      console.error('サインアップエラー:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // モーダルを開く
  const openModal = () => {
    setIsModalOpen(true);
    setEmail('');
    setPassword('');
    setError(null);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setEmail('');
    setPassword('');
    setError(null);
  };

  // ソーシャルメディアでの登録処理
  const handleSocialSignup = async (provider: string) => {
    setSocialLoading(provider);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/social-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `${provider}での登録に失敗しました`);
      }

      // リダイレクトURLがある場合はそこに遷移
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      
      // それ以外はプロフィール設定ページに遷移
      router.push('/setup-profile');
    } catch (err) {
      console.error(`${provider}サインアップエラー:`, err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
      // モーダルを開いてエラーメッセージを表示
      setIsModalOpen(true);
    } finally {
      setSocialLoading('');
    }
  };
  
  return (
    <div className="flex min-h-screen bg-prompty-background">
      {/* Left side - Welcome message */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center p-12">
        <h1 className="text-4xl font-bold mb-6">promptyにようこそ！</h1>
        
        <p className="text-lg mb-6">
          promptyは、AIプロンプトを創作する人、それを応援する人、ものづくりが好きなみんなのための場所。
        </p>
        
        <p className="text-lg mb-6">
          好みのクリエイターやコンテンツを見つけたり、自分の作りたいものを作ったりして楽しめます。
        </p>
        
        <p className="text-lg">
          いっしょに、創作の輪を広げていきましょう。
        </p>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8">
        <Link href="/" className="mb-8">
          <div className="flex items-center">
            {/* <span className="text-3xl font-bold text-prompty-primary">p<span className="text-black">rompty</span></span>
            <span className="ml-1 text-pink-400">🌸</span> */}
            <img src="/prompty_logo.jpg" alt="Prompty" className="h-40" />
          </div>
        </Link>

        <Card className="w-full max-w-md shadow-md border-gray-100">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-center mb-8">promptyに会員登録</h2>
            
            <div className="flex justify-end mb-2">
              <Link href="/Business" className="text-sm text-gray-700 hover:underline">
                法人の方
              </Link>
            </div>
            
            {/* Registration Options */}
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center py-6 border-gray-300"
                onClick={openModal}
                disabled={isLoading || !!socialLoading}
              >
                <Mail className="mr-2 h-5 w-5" />
                <span>{isLoading ? '処理中...' : 'メールで登録'}</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center py-6 border-gray-300"
                onClick={() => handleSocialSignup('google')}
                disabled={!!socialLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
                  <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3276 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/>
                  <path d="M5.50253 14.3003C4.99987 12.8099 4.99987 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC04"/>
                  <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"/>
                </svg>
                <span>{socialLoading === 'google' ? '処理中...' : 'Googleで登録'}</span>
              </Button>

              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-12 h-12 mb-2"
                onClick={() => handleSocialSignup('github')}
                disabled={!!socialLoading}
                title={process.env.NODE_ENV === 'development' ? '開発環境: Supabase管理画面でGitHubプロバイダーを有効にしてください' : ''}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                {socialLoading === 'github' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                    <div className="h-4 w-4 border-2 border-gray-900 border-t-transparent animate-spin rounded-full"></div>
                  </div>
                )}
                <span className="sr-only">GitHub</span>
              </Button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちの方は<Link href="/Login" className="text-prompty-primary hover:underline">こちら</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メール登録用モーダル */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">メールアドレスで登録</h3>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-md text-sm flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleEmailSignup}>
            <FormItem>
              <FormLabel className="text-gray-700">メールアドレス</FormLabel>
              <Input 
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-50"
              />
            </FormItem>
            
            <FormItem>
              <FormLabel className="text-gray-700">パスワード</FormLabel>
              <Input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">8文字以上の英数字を入力してください</p>
            </FormItem>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={closeModal}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button 
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? '処理中...' : '登録する'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
