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
  const [isLoginLinkLoading, setIsLoginLinkLoading] = useState(false);
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

  // ログインリンク生成処理
  const handleLoginToStripe = async () => {
    if (!stripeAccountId) {
      toast({
        title: 'エラー',
        description: 'Stripeアカウントが接続されていません',
        variant: 'destructive',
      });
      return;
    }

    setIsLoginLinkLoading(true);
    
    try {
      toast({
        title: '処理中',
        description: 'ダッシュボードアクセス用リンクを生成しています...',
        variant: 'default',
      });
      
      // ログインリンク生成API呼び出し
      const response = await axios.post('/api/stripe/create-login-link', { 
        accountId: stripeAccountId 
      });
      
      // 詳細なレスポンス情報をログに出力
      console.log('ログインリンク生成結果:', {
        status: response.status,
        url: response.data.url ? response.data.url.substring(0, 30) + '...' : 'なし',
        timestamp: response.data.createdAt || new Date().toISOString(),
        accountId: response.data.accountId
      });
      
      // 新しいタブでStripeダッシュボードを開く
      window.open(response.data.url, '_blank');
      
      toast({
        title: '成功',
        description: 'Stripeダッシュボードを新しいタブで開きました。ログイン画面が表示された場合はログインしてください。',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Stripeログインリンク生成エラー:', error);
      
      // エラーの詳細情報を取得して表示
      const errorDetails = error.response?.data || {};
      const errorMessage = errorDetails.error || 
                           error.response?.data?.message || 
                           error.message ||
                           'ログインリンクの生成に失敗しました';
      
      console.error('詳細エラー情報:', {
        message: errorMessage,
        code: errorDetails.code || error.code,
        details: errorDetails.details || null,
        status: error.response?.status || 'unknown',
        timestamp: errorDetails.timestamp || new Date().toISOString()
      });
      
      toast({
        title: 'エラー',
        description: `ダッシュボードへのアクセスに失敗しました: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoginLinkLoading(false);
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
            Stripeアカウントが接続されました。アカウントにアクセスして取引や売上を確認できます。
          </p>
          <ul className="list-disc pl-5 text-sm space-y-2">
            <li>ユーザー間の直接取引（C to C）</li>
            <li>クリエイターとして報酬を受け取る</li>
            <li>取引履歴の管理</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleLoginToStripe}
              disabled={isLoginLinkLoading}
            >
              {isLoginLinkLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  アカウントダッシュボードへ
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Stripeログインページへ
            </Button>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-md p-3 mt-4">
            <h4 className="text-sm font-medium text-amber-800 mb-1">アカウントへのアクセス方法</h4>
            <p className="text-xs text-amber-700">
              1. 上の「アカウントダッシュボードへ」ボタンを押すと自動ログインを試みます。<br />
              2. もし通常のログイン画面が表示された場合：<br />
              　・初回のみStripeからのメールで設定したパスワードを入力<br />
              　・パスワードがわからない場合は「パスワードをお忘れですか？」から再設定<br />
              　・ログイン情報を保存しておくと次回から簡単にアクセスできます
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StripeConnectSection; 