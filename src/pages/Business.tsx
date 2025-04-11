
import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';

interface BusinessFormValues {
  email: string;
  password: string;
  displayName: string;
  promptyId: string;
  termsAccepted: boolean;
}

const Business = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<BusinessFormValues>({
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      promptyId: '',
      termsAccepted: false,
    },
  });

  const onSubmit = (data: BusinessFormValues) => {
    console.log('Business registration data:', data);
    // Handle business registration
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
        <Link to="/" className="mb-8">
          <div className="flex items-center">
            <span className="text-3xl font-bold text-prompty-primary">p<span className="text-black">rompty</span></span>
            <span className="ml-1 text-pink-400">🌸</span>
          </div>
        </Link>

        <Card className="w-full max-w-md shadow-md border-gray-100">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-center mb-6">法人として会員登録</h2>
            
            <div className="flex justify-end mb-2">
              <Link to="/register" className="text-sm text-gray-700 hover:underline">
                個人の方
              </Link>
            </div>
            
            <p className="mb-6 text-sm text-gray-700">
              法人としてご登録いただいた方には、promptyの法人向け担当チームより、企業の情報発信に役立つコンテンツをお届けします。
            </p>

            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-sm text-gray-700">
                クリエイターから受け取れる <span className="font-semibold">チップ機能がオフの状態</span>でアカウント<Link to="/register" className="text-prompty-primary hover:underline">登録</Link>されます。登録後、<Link to="/login" className="text-prompty-primary hover:underline">オン</Link>にすることも可能です。
              </p>
            </div>
            
            {/* Registration Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">メールアドレス <span className="text-red-500 text-xs">必須</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="mail@example.com" 
                          className="bg-white" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">パスワード <span className="text-red-500 text-xs">必須</span></FormLabel>
                      <div className="text-xs text-gray-500 mb-1">8文字以上の半角英数記号</div>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            className="bg-white pr-10" 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute right-3 top-2.5 text-gray-500"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">promptyで表示される名前</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="promptyさん" 
                          className="bg-white" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promptyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        prompty ID（あなたのURLに使われます） <span className="text-red-500 text-xs">必須</span>
                      </FormLabel>
                      <div className="text-xs text-gray-500 mb-1">3～16文字の半角英数字・_（アンダースコア）</div>
                      <FormControl>
                        <Input 
                          placeholder="prompty_id" 
                          className="bg-white" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="termsAccepted"
                        />
                      </FormControl>
                      <div className="text-sm">
                        会員登録には、<Link to="/terms" className="text-prompty-primary hover:underline">利用規約</Link> と <Link to="/privacy" className="text-prompty-primary hover:underline">プライバシーポリシー</Link>への同意が必要です。
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 mt-6"
                >
                  同意して登録する
                </Button>
              </form>
            </Form>
            
            <div className="mt-8 text-center">
              <Link to="/login" className="text-prompty-primary hover:underline text-sm">
                ログインはこちら
              </Link>
              <div className="mt-4">
                <Link to="/register" className="text-prompty-primary hover:underline text-sm">
                  登録でお困りの方
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Business;
