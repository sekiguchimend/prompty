"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { useRouter } from 'next/router';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';

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

const ResetPassword = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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
    
    if (!password) {
      setError('新しいパスワードは必須です');
      return;
    }
    
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('パスワードと確認用パスワードが一致しません');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Supabaseのパスワード更新機能を使用
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw new Error(error.message || 'パスワードの更新に失敗しました');
      }

      // 成功メッセージを表示
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      
      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/Login');
      }, 3000);
    } catch (err) {
      console.error('パスワード更新エラー:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ローディング表示
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

  return (
    <div className="flex min-h-screen bg-prompty-background">
      <div className="w-full flex flex-col items-center justify-start p-4 pt-20 md:justify-center md:p-8 md:pt-8">
        <Link href="/" className="mb-6 md:mb-4">
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
              <h1 className="text-2xl font-bold text-center mb-4">新しいパスワードを設定</h1>
              <p className="text-gray-600">
                新しいパスワードを入力して、アカウントのパスワードを再設定してください。
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
                <span>パスワードが正常に更新されました。自動的にログインページに移動します。</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormItem>
                <FormLabel className="text-gray-700">新しいパスワード</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-10 bg-transparent border-gray-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">8文字以上の英数字を入力してください</p>
              </FormItem>
              
              <FormItem>
                <FormLabel className="text-gray-700">パスワードの確認</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    className="pl-10 bg-transparent border-gray-300"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </FormItem>
              
              <Button 
                type="submit" 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                disabled={isSubmitting || success}
              >
                {isSubmitting ? '処理中...' : 'パスワードを更新'}
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

export default ResetPassword; 