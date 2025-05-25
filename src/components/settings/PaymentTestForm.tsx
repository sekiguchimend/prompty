import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2, CreditCard } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../hooks/use-toast';

interface PaymentTestFormProps {
  receiverId: string;
  stripeAccountId?: string | null;
}

const PaymentTestForm: React.FC<PaymentTestFormProps> = ({ receiverId, stripeAccountId }) => {
  const [amount, setAmount] = useState<number>(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  // 金額変更ハンドラー
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };

  // 支払い処理ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripeAccountId) {
      toast({
        title: 'エラー',
        description: '受け取り側のStripeアカウントが設定されていません',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    setPaymentStatus('idle');
    
    try {
      // 実際の実装では、ここでStripe.jsを使用してカード情報を収集し、
      // PaymentIntentのクライアントシークレットを取得してからカード決済を行います
      // 簡略化のため、コンソールにメッセージを表示するだけにしています
      
      console.log('決済リクエスト:', {
        userId: receiverId,
        amount: amount,
        currency: 'jpy'
      });
      
      // PaymentIntentの作成をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 成功通知
      toast({
        title: '決済テスト',
        description: `${amount}円の決済リクエストが送信されました（デモモード）`,
      });
      
      setPaymentStatus('success');
    } catch (error: any) {
      console.error('決済エラー:', error);
      toast({
        title: 'エラー',
        description: error.response?.data?.error || '決済処理に失敗しました',
        variant: 'destructive',
      });
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripeAccountId) {
    return (
      <div className="mt-4 text-sm text-gray-500">
        決済機能を有効にするには、Stripeアカウントを接続してください。
      </div>
    );
  }

  return (
    <div className="mt-6 border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-4">決済テスト（デモンストレーション用）</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              金額（円）
            </label>
            <Input
              id="amount"
              type="number"
              min={100}
              value={amount}
              onChange={handleAmountChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カード情報
            </label>
            <div className="p-4 border rounded bg-gray-50 text-center text-sm text-gray-500">
              デモモードでは、実際のカード情報は収集されません
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {amount}円を支払う
              </>
            )}
          </Button>
          
          {paymentStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded text-sm">
              テスト決済が完了しました（デモモード）
            </div>
          )}
          
          {paymentStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              決済処理に失敗しました
            </div>
          )}
        </div>
      </form>
      
      <div className="mt-6 text-xs text-gray-500">
        <p>※ このフォームはデモンストレーション用です。実際の決済は行われません。</p>
        <p>※ 実際の実装では、StripeのAPI仕様に準拠したセキュアな決済処理が必要です。</p>
      </div>
    </div>
  );
};

export default PaymentTestForm; 