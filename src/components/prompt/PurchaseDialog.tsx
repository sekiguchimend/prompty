import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, AlertCircle, X, CreditCard, Banknote, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/use-toast';
import { UnifiedAvatar } from '../index';

interface PromptDetails {
  id?: string;
  title: string;
  author: {
    name: string;
    avatarUrl: string;
    userId?: string;
    stripe_price_id?: string;
  };
  price: number;
}

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptDetails;
  onPurchaseSuccess?: () => void;
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ isOpen, onClose, prompt, onPurchaseSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [promptDetails, setPromptDetails] = useState<{
    stripe_price_id?: string;
    author_id?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // プロンプト詳細情報を取得
  useEffect(() => {
    if (isOpen && prompt?.id && (!promptDetails.stripe_price_id || !promptDetails.author_id)) {
      fetchPromptDetails();
    }
  }, [isOpen, prompt?.id]);

  const fetchPromptDetails = async () => {
    if (!prompt.id) return;
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('stripe_price_id, author_id')
        .eq('id', prompt.id)
        .single();
        
      if (error) {
        throw new Error(`プロンプト情報の取得に失敗しました: ${error.message}`);
      }
      
      setPromptDetails(data);
      
      if (!data.stripe_price_id) {
        setError('このコンテンツには購入情報が設定されていません');
      } else {
        setError(null);
      }
    } catch (e) {
      console.error('プロンプト詳細取得エラー:', e);
      setError(e instanceof Error ? e.message : '購入情報の取得に失敗しました');
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'ログインが必要です',
          description: 'コンテンツを購入するにはログインしてください',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Stripe情報の確認
      const stripeData = promptDetails.stripe_price_id || prompt.author.stripe_price_id;
      const authorId = promptDetails.author_id || prompt.author.userId;
      
      if (!stripeData) {
        throw new Error('このコンテンツには購入情報が設定されていません');
      }
      
      if (!authorId) {
        throw new Error('投稿者情報が見つかりません');
      }

      // 決済処理
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          prompt_id: prompt.id,
          price: prompt.price,
          currency: 'jpy',
          stripe_price_id: stripeData,
          author_id: authorId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '決済処理に失敗しました');
      }

      const data = await res.json();
      
      if (data.url) {
        // Stripeの決済ページへリダイレクト
        window.location.href = data.url;
      } else if (data.success) {
        // 直接成功した場合（テスト環境など）
        try {
          // purchases テーブルに直接購入レコードを追加
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              buyer_id: session.user.id,
              prompt_id: prompt.id,
              status: 'completed',
              amount: prompt.price,
              created_at: new Date().toISOString()
            });
          
          if (purchaseError) {
            console.error('購入レコード作成エラー:', purchaseError);
            // エラーは通知するがフローは続行
            toast({
              title: '注意',
              description: '購入は完了しましたが、記録に問題が発生しました。再読み込みしてください。',
              variant: 'default'
            });
          } else {
          }
        } catch (purchaseErr) {
          console.error('購入記録処理エラー:', purchaseErr);
        }

        toast({
          title: '購入完了',
          description: 'コンテンツの購入が完了しました',
          variant: 'default'
        });
        
        if (onPurchaseSuccess) onPurchaseSuccess();
        onClose();
        
        // 購入完了後、ページをリロードして購入状態を反映（success=1パラメータを追加）
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('success', '1');
        window.location.href = currentUrl.toString();
      } else {
        throw new Error('決済処理に失敗しました');
      }
    } catch (e) {
      console.error('購入処理エラー:', e);
      setError(e instanceof Error ? e.message : '決済処理でエラーが発生しました');
      toast({
        title: 'エラーが発生しました',
        description: e instanceof Error ? e.message : '決済処理でエラーが発生しました',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">購入の確認</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            以下のコンテンツを購入します
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-start space-x-4 py-4">
          <UnifiedAvatar
            src={prompt.author.avatarUrl}
            displayName={prompt.author.name}
            size="md"
          />
          <div>
            <p className="font-medium mb-1">{prompt.title}</p>
            <p className="text-sm text-gray-500">{prompt.author.name}</p>
            <p className="font-bold mt-2">¥{prompt.price.toLocaleString()}</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-sm text-red-600 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
          <p>購入後、すぐにコンテンツの全文が読めるようになります。</p>
          <p>購入履歴からいつでも読み返すことができます。</p>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="flex items-center mt-3 sm:mt-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm">コンテンツへ戻る</span>
          </Button>
          <Button 
            onClick={handlePurchase} 
            className="bg-gray-900 text-white hover:bg-gray-800" 
            disabled={loading || Boolean(error)}
          >
            {loading ? '処理中...' : '購入する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
