import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../hooks/use-toast';

interface StripeConnectSectionProps {
  userId: string;
  stripeAccountId?: string | null;
}

const StripeConnectSection: React.FC<StripeConnectSectionProps> = ({ userId, stripeAccountId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accountStatus, setAccountStatus] = useState<'none' | 'pending' | 'complete'>('none');
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  // Stripeアカウントの状態を確認
  useEffect(() => {
    if (stripeAccountId) {
      setAccountStatus('complete');
      // 実際には、Stripeアカウントの詳細情報を取得して状態を確認するべき
      // 簡略化のため、アカウントIDがあれば完了とみなす
    }
  }, [stripeAccountId]);

  // Expressアカウント作成処理
  const handleCreateAccount = async () => {
    setIsConnecting(true);
    setApiError(null);
    
    try {
      // Expressアカウント作成API呼び出し
      const { data: acctData } = await axios.post('/api/stripe/create-express-account', { userId });
      
      // アカウントリンク生成API呼び出し
      const { data: linkData } = await axios.post('/api/stripe/create-account-link', { 
        accountId: acctData.accountId 
      });
      
      // Stripeダッシュボードへリダイレクト
      window.location.href = linkData.url;
    } catch (error: any) {
      console.error('Stripe接続エラー:', error);
      
      // エラーメッセージを取得
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          '接続に失敗しました';
      
      // シークレットキーのエラーを検出
      if (errorMessage.includes('secret_key_required') || 
          errorMessage.includes('API key')) {
        setApiError('Stripe APIキーが正しく設定されていません。管理者に連絡してください。');
      } else {
        setApiError(errorMessage);
      }
      
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Stripe Connect</h3>
          <p className="text-sm text-gray-500 mt-1">
            売り手として取引を行うには、Stripeアカウントの接続が必要です。
          </p>
        </div>
        {accountStatus === 'complete' && (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="mr-1 h-5 w-5" />
            <span className="text-sm font-medium">接続済み</span>
          </div>
        )}
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div className="text-sm text-amber-700">{apiError}</div>
          </div>
          <p className="text-xs text-amber-600 mt-2 pl-7">
            Stripe API設定が正しく構成されていない可能性があります。
            管理者に連絡してください。
          </p>
        </div>
      )}

      {accountStatus === 'none' && (
        <Button
          onClick={handleCreateAccount}
          disabled={isConnecting}
          className="w-full mt-4"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              接続中...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Stripeアカウントに接続する
            </>
          )}
        </Button>
      )}

      {accountStatus === 'pending' && (
        <div className="flex items-center text-amber-600 mt-4">
          <AlertCircle className="mr-2 h-5 w-5" />
          <span className="text-sm">アカウント設定が未完了です。設定を完了してください。</span>
        </div>
      )}

      {accountStatus === 'complete' && (
        <div className="mt-4">
          <p className="text-sm mb-4">
            Stripeアカウントが接続されました。以下の機能が利用可能です：
          </p>
          <ul className="list-disc pl-5 text-sm space-y-2">
            <li>ユーザー間の直接取引（C to C）</li>
            <li>クリエイターとして報酬を受け取る</li>
            <li>取引履歴の管理</li>
          </ul>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Stripeダッシュボードを開く
          </Button>
        </div>
      )}
    </div>
  );
};

export default StripeConnectSection; 