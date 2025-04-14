
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Register = () => {
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
            {/* <span className="text-3xl font-bold text-prompty-primary">p<span className="text-black">rompty</span></span>
            <span className="ml-1 text-pink-400">🌸</span> */}
            <img src="/prompty_logo.jpg" alt="Prompty" className="h-8" />
          </div>
        </Link>

        <Card className="w-full max-w-md shadow-md border-gray-100">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-center mb-8">promptyに会員登録</h2>
            
            <div className="flex justify-end mb-2">
              <Link to="/business" className="text-sm text-gray-700 hover:underline">
                法人の方
              </Link>
            </div>
            
            {/* Registration Options */}
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center py-6 border-gray-300"
              >
                <Mail className="mr-2 h-5 w-5" />
                <span>メールで登録</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center py-6 border-gray-300"
              >
                <svg className="mr-2 h-5 w-5 text-red-500" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                <span>Googleで登録</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center py-6 border-gray-300"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M13.3532 3.00031C13.1187 3.00031 12.0404 3.053 11.3229 3.816C10.6992 4.51608 10.5772 5.40955 10.5771 5.71486C10.577 5.88337 10.6396 6.31311 10.6396 6.31331C10.6396 6.31331 9.4989 6.3955 8.81657 7.08026C8.13168 7.76745 8.00928 8.56264 8.00928 8.56264C8.00928 8.56264 6.60352 8.74926 5.81628 9.79474C5.02904 10.8404 5.06267 12.095 5.06267 12.095C5.06267 12.095 4.15887 12.9825 4.02522 14.2891C3.89157 15.596 4.43012 16.6217 4.43012 16.6217C4.43012 16.6217 3.89179 17.6021 4.06066 18.6256C4.14391 19.0973 4.48123 19.8766 5.29999 20.5909C6.29274 21.4574 7.9357 22.0001 9.00038 22.0001H15.0004C16.0651 22.0001 17.708 21.4574 18.7008 20.5909C19.5196 19.8766 19.8569 19.0973 19.9401 18.6256C20.109 17.6023 19.5707 16.6217 19.5707 16.6217C19.5707 16.6217 20.1092 15.5957 19.9756 14.2891C19.8419 12.9825 18.9381 12.095 18.9381 12.095C18.9381 12.095 18.9718 10.8404 18.1845 9.79474C17.3973 8.74926 15.9915 8.56264 15.9915 8.56264C15.9915 8.56264 15.8691 7.76745 15.1842 7.08026C14.5019 6.3955 13.3612 6.31331 13.3612 6.31331C13.3612 6.31331 13.4238 5.88337 13.4237 5.71486C13.4236 5.40955 13.3016 4.51608 12.6779 3.816C11.9604 3.053 10.8821 3.00031 10.6476 3.00031H13.3532Z"/>
                </svg>
                <span>X（Twitter）で登録</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center py-6 border-gray-300"
              >
                <Apple className="mr-2 h-5 w-5" />
                <span>Appleで登録</span>
              </Button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちの方は<Link to="/login" className="text-prompty-primary hover:underline">こちら</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
