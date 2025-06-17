"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Github } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';

// モーダルコンポーネント - noteスタイル
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <span className="text-xl">×</span>
        </button>
        {children}
      </div>
    </div>
  );
};

const Register = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      // クライアントサイドからSupabaseに直接接続
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/setup-profile`,
        }
      });
      
      if (signUpError) {
        throw new Error(signUpError.message || 'サインアップに失敗しました');
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

  // パスワードの表示/非表示を切り替える
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ソーシャルメディアでの登録処理
  const handleSocialSignup = async (provider: string) => {
    setSocialLoading(provider);
    setError(null);
    
    try {
      // クライアントサイドからSupabaseに直接接続
      const { data, error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase() as any,
        options: {
          redirectTo: `${window.location.origin}/setup-profile`,
        }
      });
      
      if (signUpError) {
        throw new Error(signUpError.message || `${provider}での登録に失敗しました`);
      }

      // リダイレクトURLがある場合はそこに遷移
      if (data?.url) {
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
      <div className="hidden md:flex md:w-1/2 flex-col justify-center p-4 pr-2 pl-8">
        <div className="max-w-lg mx-auto">
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
      </div>

      {/* Right side - Registration form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-start p-0 pt-5 md:justify-center md:pt-0 md:min-h-screen md:pl-2 md:pr-8">
        <div className="flex flex-col items-center md:transform md:-translate-y-8 w-full max-w-md">
          <Link href="/" className="mb-6 md:mb-6">
            <div className="flex items-center">
              <Image 
                src="https://qrxrulntwojimhhhnwqk.supabase.co/storage/v1/object/public/prompt-thumbnails/prompty_logo(1).png" 
                alt="Prompty" 
                className="object-contain"
                width={120}
                height={40}
                style={{
                  objectFit: 'contain',
                  maxHeight: '40px',
                  width: 'auto'
                }}
                priority
              />
            </div>
          </Link>

          <Card className="w-full bg-transparent">
            <CardContent className="pt-6 bg-transparent">
              <h2 className="text-2xl font-bold text-center mb-8">promptyに会員登録</h2>
              
              <div className="flex justify-end mb-2">
                <Link href="/business" className="text-sm text-gray-700 hover:underline">
                  法人の方
                </Link>
              </div>
              
              {/* Registration Options */}
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center py-6 border-gray-300 bg-transparent"
                  onClick={openModal}
                  disabled={isLoading || !!socialLoading}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  <span>{isLoading ? '処理中...' : 'メールで登録'}</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center py-6 border-gray-300 bg-transparent"
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
                  className="w-full flex items-center justify-center py-6 border-gray-300 bg-transparent"
                  onClick={() => handleSocialSignup('github')}
                  disabled={!!socialLoading}
                  title={process.env.NODE_ENV === 'development' ? '開発環境: Supabase管理画面でGitHubプロバイダーを有効にしてください' : ''}
                >
                  <Github className="mr-2 h-5 w-5" />
                  <span>{socialLoading === 'github' ? '処理中...' : 'GitHubで登録'}</span>
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  アカウントをお持ちの方は<Link href="/login" className="text-prompty-primary hover:underline">こちら</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* メール登録用モーダル - noteスタイル */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-6">promptyアカウントを作成</h3>
          
          {error && (
            <div className="mb-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailSignup}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                メールアドレス
              </label>
              <input 
                type="email"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                パスワード
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none pr-10"
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded text-gray-800 font-medium transition-colors"
            >
              {isLoading ? '処理中...' : '同意して登録'}
            </button>
          </form>
          
          <div className="mt-4 text-sm text-center text-gray-500">
            会員登録には、<Link href="/Terms" className="text-gray-800 hover:underline">利用規約</Link>と
            <Link href="/Privacy" className="text-gray-800 hover:underline">プライバシーポリシー</Link>への同意が必要です。
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link href="/login" className="text-gray-800 hover:underline text-sm mr-2">
              ログイン
            </Link>
            <span className="text-gray-400 mx-2">|</span>
            <Link href="/signup-help" className="text-gray-800 hover:underline text-sm ml-2">
              登録でお困りの方
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
