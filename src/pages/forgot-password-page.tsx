import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

type FormValues = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Success
      toast.success('パスワード再設定のメールが送信されました', {
        description: `${data.email}宛にパスワード再設定のメールを送信しました。`,
      });
      setSubmitted(true);
    } catch (error) {
      toast.error('エラーが発生しました', {
        description: 'もう一度お試しください。',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 md:px-8">
      <Link href="/login" className="mb-8 flex items-center text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="mr-2 h-4 w-4" />
        ログインに戻る
      </Link>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">パスワード再設定</CardTitle>
          <CardDescription>
            {!submitted 
              ? 'アカウントに登録されたメールアドレスを入力してください' 
              : 'メールをご確認ください'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!submitted ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="you@example.com" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-black hover:bg-gray-800" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '送信中...' : '再設定リンクを送信'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                パスワード再設定のメールを送信しました。メール内のリンクをクリックして、パスワードの再設定を完了してください。
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSubmitted(false)} 
                className="mt-4"
              >
                メールが届かない場合は再送信
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 border-t px-6 py-4">
          <div className="text-center text-sm">
            <span className="text-gray-500">アカウントをお持ちでない方は</span>{' '}
            <Link href="/register" className="font-medium text-pink-400 hover:text-pink-500">
              会員登録
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
