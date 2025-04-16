"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Apple, Twitter, Mail, Lock, AlertCircle, Github } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth-context';
// Manually implement or mock the missing components
const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`border rounded px-3 py-2 w-full ${className}`} {...props} />
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg ${className}`}>{children}</div>
);

const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Form = ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement> & { children: React.ReactNode }) => (
  <form {...props}>{children}</form>
);

const FormField = ({ name, control, render }: { name: string, control: any, render: (props: any) => React.ReactNode }) => (
  render({ field: { name } })
);

const FormItem = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

const FormLabel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={`block mb-1 ${className}`}>{children}</label>
);

const FormControl = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const Checkbox = ({ id, checked, onChange }: { id?: string, checked?: boolean, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <input type="checkbox" id={id} className="rounded border-gray-300" checked={checked} onChange={onChange} />
);

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState('');
  
  // ユーザーが既にログインしている場合はホームページにリダイレクト
  useEffect(() => {
    if (user && !isLoading) {
      console.log('🟢 User already logged in, redirecting to home');
      router.push('/');
    }
  }, [user, isLoading, router]);
  
  // フォームの入力状態を監視し、ボタンの色を切り替える
  const isFormValid = email.trim() !== '' && password.trim() !== '';

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
    
    if (!email || !password) {
      setError('メールアドレスとパスワードは必須です');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('ログイン試行:', { email, passwordLength: password.length });
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      console.log('ログインレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      // ログイン成功
      console.log('ログイン成功:', data);
      
      // セッション情報をローカルストレージに保存
      if (data.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
      }
      
      // 1秒待機してから遷移（セッション情報が反映されるのを待つ）
      setTimeout(() => {
        window.location.href = '/'; // router.pushではなくwindow.locationを使用
      }, 500);
    } catch (err) {
      console.error('ログインエラー詳細:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/social-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.toLowerCase() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // プロバイダーが有効化されていないエラーの場合、わかりやすいメッセージを表示
        if (data.error_code === 'validation_failed' && data.msg?.includes('provider is not enabled')) {
          throw new Error(`${provider}でのログインは現在設定されていません。管理者に連絡してください。`);
        }
        throw new Error(data.error || data.msg || `${provider}でのログインに失敗しました`);
      }

      // リダイレクトURLがある場合はそこに遷移
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      
      // リダイレクトURLがない場合もホームページに遷移
      window.location.href = '/';
    } catch (err) {
      console.error(`${provider}ログインエラー:`, err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setSocialLoading('');
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
      {/* Login form - centered */}
      <div className="w-full flex flex-col items-center justify-center p-8">
        <Link href="/" className="mb-8">
          <div className="flex items-center">
            {/* <span className="text-3xl font-bold text-prompty-primary">p<span className="text-black">rompty</span></span>
            <span className="ml-1 text-pink-400">🌸</span> */}
            <img src="/prompty_logo.jpg" alt="Prompty" className="h-40" />
          </div>
        </Link>

        <Card className="w-full max-w-md shadow-md border-gray-100">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-center mb-8">ログイン</h1>
            
            {/* エラーメッセージ表示 */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-md text-sm flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Social Login Options */}
            <div className="flex justify-center space-x-3 mb-8 flex-wrap">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-12 h-12 mb-2"
                onClick={() => handleSocialLogin('Google')}
                disabled={!!socialLoading || isSubmitting}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
                  <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3276 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/>
                  <path d="M5.50253 14.3003C4.99987 12.8099 4.99987 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC04"/>
                  <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"/>
                </svg>
                <span className="sr-only">Google</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-12 h-12 mb-2"
                onClick={() => handleSocialLogin('github')}
                disabled={!!socialLoading || isSubmitting}
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

            <div className="flex items-center mb-8">
              <div className="flex-grow h-px bg-gray-200"></div>
              <span className="px-4 text-sm text-gray-500">またはメールアドレスでログイン</span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
            
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormItem>
                <FormLabel className="text-gray-700">メールアドレス または prompty ID</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    type="email"
                    placeholder="your@email.com" 
                    className="pl-10 bg-gray-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </FormItem>
              
              <FormItem>
                <FormLabel className="text-gray-700">パスワード</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-gray-50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </FormItem>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label 
                    htmlFor="remember" 
                    className="ml-2 text-sm text-gray-600 cursor-pointer"
                  >
                    ログイン情報を保存
                  </label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-prompty-primary hover:underline"
                >
                  パスワードを忘れた方
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className={`w-full transition-colors ${
                  isFormValid 
                    ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
                disabled={isSubmitting || !!socialLoading}
              >
                {isSubmitting ? '処理中...' : 'ログイン'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                会員登録は<Link href="/Register" className="text-prompty-primary hover:underline">こちら</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
