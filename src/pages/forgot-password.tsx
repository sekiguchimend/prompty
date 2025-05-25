"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth-context';
import Image from 'next/image';
import { supabase } from '../../lib/supabase/client';

// Manually implement or mock the missing components
const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`border rounded px-3 py-2 w-full ${className}`} {...props} />
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-lg ${className}`}>{children}</div>
);

const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 bg-transparent ${className}`}>{children}</div>
);

const FormItem = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

const FormLabel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={`block mb-1 ${className}`}>{children}</label>
);

const ForgotPassword = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // ユーザーが既にログインしている場合はホームページにリダイレクト
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User already logged in, redirecting to home');
      router.push('/');
    }
  }, [user, isLoading, router]);

  // エラーメッセージを数秒後に消す
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('メールアドレスは必須です');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Supabaseのパスワードリセット機能を使用
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw new Error(error.message || 'パスワードリセットメールの送信に失敗しました');
      }

      // 成功メッセージを表示
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('パスワードリセットエラー:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 既にログイン中の場合はローディング表示
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prompty-background">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold">読み込み中...</div>
          <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // ユーザーが既にログインしている場合は何も表示しない（useEffectでリダイレクト）
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-prompty-background">
      <div className="w-full flex flex-col items-center justify-start p-0 pt-0 mt-10 md:justify-center md:p-8 md:mt-[-80px]">
        <Link href="/" className="mb-0 mt-2 md:mb-4">
          <div className="flex items-center">
            <Image 
              src="https://qrxrulntwojimhhhnwqk.supabase.co/storage/v1/object/public/prompt-thumbnails/prompty_logo(1).png" 
              alt="Prompty" 
              className="object-contain"
              width={120}
              height={400}
              style={{
                objectFit: 'contain',
                maxHeight: '40px',
                width: 'auto'
              }}
              priority
            />
          </div>
        </Link>

        <Card className="w-full max-w-md">
          <CardContent className="pt-3">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Link href="/Login" className="text-gray-500 hover:text-gray-700 mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold">パスワードをリセット</h1>
              </div>
              <p className="text-gray-600">
                アカウントに登録したメールアドレスを入力してください。パスワード再設定用のリンクをメールでお送りします。
              </p>
            </div>
            
            {/* エラーメッセージ表示 */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-md text-sm flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {/* 成功メッセージ表示 */}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 mb-4 rounded-md text-sm flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>パスワードリセットのメールを送信しました。メールのリンクからパスワードを再設定してください。</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormItem>
                <FormLabel className="text-gray-700">メールアドレス</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    type="email"
                    placeholder="your@email.com" 
                    className="pl-10 bg-transparent border-gray-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </FormItem>
              
              <Button 
                type="submit" 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? '処理中...' : 'リセットリンクを送信'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <Link href="/Login" className="text-prompty-primary hover:underline">ログインページに戻る</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword; 