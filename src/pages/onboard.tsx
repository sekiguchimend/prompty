import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import Head from 'next/head';

const OnboardPage = () => {
  const router = useRouter();
  const { completed, refresh } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'refresh'>('loading');
  
  useEffect(() => {
    // URLクエリパラメータに基づいて状態を設定
    if (completed === 'true') {
      setStatus('success');
    } else if (refresh === 'true') {
      setStatus('refresh');
    }
  }, [completed, refresh]);

  // 設定画面に戻る
  const handleBackToSettings = () => {
    router.push('/');
  };

  // 再度オンボーディングを試行
  const handleRetry = () => {
    // 実際のアプリケーションでは、このリンクを使ってStripeへの再接続を試みる
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Stripe Connect 接続 {status === 'success' ? '完了' : 'リフレッシュ'} | Prompty</title>
        <meta name="description" content="Stripe Connect アカウント接続ステータス" />
      </Head>
      
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          {status === 'loading' && (
            <div className="flex flex-col items-center text-center">
              <div className="animate-spin h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent mb-4"></div>
              <h1 className="text-2xl font-bold mb-2">処理中...</h1>
              <p className="text-gray-600">接続状態を確認しています。</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">接続完了！</h1>
              <p className="text-gray-600 mb-6">
                Stripeアカウントとの接続が完了しました。これでC to C決済機能を利用できるようになりました。
              </p>
              <div className="space-y-4 w-full">
                <Button onClick={handleBackToSettings} className="w-full" size="lg">
                  ホーム画面に戻る
                </Button>
              </div>
            </div>
          )}
          
          {status === 'refresh' && (
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={48} className="text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">接続が中断されました</h1>
              <p className="text-gray-600 mb-6">
                Stripeアカウントとの接続処理が完了しませんでした。もう一度お試しください。
              </p>
              <div className="space-y-4 w-full">
                <Button onClick={handleRetry} className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  再接続する
                </Button>
                <Button onClick={handleBackToSettings} className="w-full" variant="outline" size="lg">
                  設定画面に戻る
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              問題が発生した場合は、サポートにお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardPage; 