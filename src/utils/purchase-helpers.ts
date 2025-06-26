/**
 * 購入状態の判定と管理のためのユーティリティ関数
 */
import { supabase } from '../lib/supabase-unified';

/**
 * ユーザーが特定のプロンプトを購入済みかどうかを判定
 * - purchasesテーブルで購入状態を確認
 */
export async function checkPurchaseStatus(
  userId: string | undefined,
  promptId: string
): Promise<boolean> {
  if (!userId || !promptId) return false;

  try {

    
    // purchasesテーブルで購入状態を確認（buyer_idでチェック）
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

    // データベースエラーの場合は詳細をログに出力
    if (purchaseError) {
      console.error('purchasesテーブル(buyer_id)エラー:', purchaseError);
    }
    
    // ステータス指定なしでもう一度チェック（念のため）
    const { data: purchaseDataAlt, error: purchaseErrorAlt } = await supabase
      .from('purchases')
      .select('id')
      .eq('buyer_id', userId)
      .eq('prompt_id', promptId)
      .maybeSingle();
      
    if (purchaseDataAlt && !purchaseErrorAlt) {
      return true;
    }

    // データベースエラーの場合は詳細をログに出力
    if (purchaseErrorAlt) {
      console.error('purchasesテーブル(buyer_id、ステータス指定なし)エラー:', purchaseErrorAlt);
    }
    
    return false;
    
  } catch (e) {
    console.error("購入状態チェックエラー:", e);
    return false;
  }
}

/**
 * ユーザーの全購入履歴を取得
 */
export async function fetchUserPurchases(userId: string) {
  if (!userId) return [];

  try {
    // purchasesテーブルから購入済みのプロンプトを取得
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        id,
        prompt_id,
        status,
        created_at,
        amount,
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
      // データベースエラーがあっても空の配列を返して処理を継続
      return [];
    }

    return purchaseData || [];
  } catch (e) {
    console.error('購入履歴取得処理エラー:', e);
    return [];
  }
} 