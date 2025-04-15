"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Apple, Twitter, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
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

const Checkbox = ({ id }: { id?: string }) => (
  <input type="checkbox" id={id} className="rounded border-gray-300" />
);

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login = () => {
  const router = useRouter();
  const [isFormValid, setIsFormValid] = useState(false);
  
  const form = {
    handleSubmit: (callback: (data: LoginFormValues) => void) => (e: React.FormEvent) => {
      e.preventDefault();
      callback({ email: '', password: '', rememberMe: false });
    },
    control: {},
    watch: (callback: (data: any) => void) => {
      // Simplified mock of react-hook-form's watch
      return { unsubscribe: () => {} };
    }
  };

  // フォームの入力状態を監視し、ボタンの色を切り替える
  useEffect(() => {
    setIsFormValid(false); // Simplified for mock implementation
    return () => {};
  }, []);

  const onSubmit = (data: LoginFormValues) => {
    console.log('Login attempt with:', data);
    // ここでは認証ロジックを省略し、単純にホームページへリダイレクト
    router.push('/');
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // ソーシャルログイン処理を省略してホームページへリダイレクト
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-prompty-background">
      {/* Login form - centered */}
      <div className="w-full flex flex-col items-center justify-center p-8">
        <Link href="/" className="mb-8">
          <div className="flex items-center">
            {/* <span className="text-3xl font-bold text-prompty-primary">p<span className="text-black">rompty</span></span>
            <span className="ml-1 text-pink-400">🌸</span> */}
            <img src="/prompty_logo.jpg" alt="Prompty" className="h-32" />
          </div>
        </Link>

        <Card className="w-full max-w-md shadow-md border-gray-100">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-center mb-8">ログイン</h1>
            
            {/* Social Login Options */}
            <div className="flex justify-center space-x-4 mb-8">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-12 h-12"
                onClick={() => handleSocialLogin('Google')}
              >
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                <span className="sr-only">Google</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-12 h-12"
                onClick={() => handleSocialLogin('Twitter')}
              >
                <Twitter className="h-5 w-5 text-blue-400" />
                <span className="sr-only">Twitter</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full w-12 h-12"
                onClick={() => handleSocialLogin('Apple')}
              >
                <Apple className="h-5 w-5" />
                <span className="sr-only">Apple</span>
              </Button>
            </div>

            <div className="flex items-center mb-8">
              <div className="flex-grow h-px bg-gray-200"></div>
              <span className="px-4 text-sm text-gray-500">またはメールアドレスでログイン</span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
            
            {/* Login Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">メールアドレス または prompty ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input 
                            placeholder="your@email.com" 
                            className="pl-10 bg-gray-50" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">パスワード</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 bg-gray-50" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="">
                  <div className="flex items-center">
                    <Checkbox id="remember" />
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
                >
                  ログイン
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                会員登録は<Link href="/register" className="text-prompty-primary hover:underline">こちら</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
