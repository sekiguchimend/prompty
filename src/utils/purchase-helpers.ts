/**
 * 購入状態の判定と管理のためのユーティリティ関数
 */
import { supabase } from '../lib/supabaseClient';

/**
 * ユーザーが特定のプロンプトを購入済みかどうかを判定
 * - paymentsテーブルまたはpurchasesテーブルで購入状態を確認
 */
export async function checkPurchaseStatus(
  userId: string | undefined,
  promptId: string
): Promise<boolean> {
  if (!userId || !promptId) return false;

  try {
    // まずpaymentsテーブルをチェック
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .eq('status', 'paid')
      .maybeSingle();

    // paymentsテーブルで購入が確認できた場合
    if (paymentData && !paymentError) {
      return true;
    }

    // paymentsテーブルがない、または他のエラーの場合はpurchasesテーブルも確認
    if (paymentError?.code === '42P01' || paymentError?.message?.includes('does not exist') || !paymentData) {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('buyer_id', userId)
        .eq('prompt_id', promptId)
        .eq('status', 'completed')
        .maybeSingle();

      // purchasesテーブルで購入が確認できた場合
      if (purchaseData && !purchaseError) {
        return true;
      }
    }

    // どちらのテーブルでも購入が確認できなかった場合
    return false;
  } catch (e) {
    console.error('購入状態確認エラー:', e);
    return false;
  }
}

/**
 * ユーザーの全購入履歴を取得
 */
export async function fetchUserPurchases(userId: string) {
  if (!userId) return [];

  try {
    // paymentsテーブルから購入済みのプロンプトを取得
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id,
        prompt_id,
        status,
        created_at,
        amount,
        currency,
        prompts:prompt_id (
          id,
          title,
          price,
          author_id,
          created_at,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'paid');

    if (paymentError) {
      console.error('支払い履歴取得エラー:', paymentError);
      // paymentsテーブルがない場合はpurchasesテーブルを確認
    }

    // purchasesテーブルから購入済みのプロンプトを取得
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        id,
        prompt_id,
        status,
        created_at,
        amount,
        currency,
        prompts:prompt_id (
          id,
          title,
          price,
          author_id,
          created_at,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('buyer_id', userId)
      .eq('status', 'completed');

    if (purchaseError) {
      console.error('購入履歴取得エラー:', purchaseError);
    }

    // 両方のデータを結合（存在する場合のみ）
    const payments = paymentData || [];
    const purchases = purchaseData || [];
    
    // 両方のテーブルから取得したデータを結合し、prompt_idでの重複を除外
    const allPurchases = [...payments, ...purchases];
    
    // 重複除去（同じprompt_idのものは最新のものを残す）
    const uniquePurchases = allPurchases.reduce((acc: any[], purchase: any) => {
      const existingIndex = acc.findIndex(p => p.prompt_id === purchase.prompt_id);
      if (existingIndex >= 0) {
        // 既存のエントリより新しい場合は置き換え
        const existingDate = new Date(acc[existingIndex].created_at).getTime();
        const newDate = new Date(purchase.created_at).getTime();
        if (newDate > existingDate) {
          acc[existingIndex] = purchase;
        }
      } else {
        // 存在しない場合は追加
        acc.push(purchase);
      }
      return acc;
    }, []);

    return uniquePurchases;
  } catch (e) {
    console.error('購入履歴取得処理エラー:', e);
    return [];
  }
} 