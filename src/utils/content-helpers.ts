/**
 * コンテンツの有料・無料状態判定のためのユーティリティ関数
 */

/**
 * プロンプトが無料かどうかを判定
 * - is_free=true または price=0 または price=null または priceがNaNの場合に無料と判定
 */
export function isContentFree(
  data: { 
    is_free?: boolean; 
    price?: number | string | null; 
    stripe_product_id?: string | null; 
    stripe_price_id?: string | null; 
  }
): boolean {
  // 価格を数値に変換（文字列や他の型の場合に対応）
  const numericPrice = data.price === null || data.price === undefined ? 0 : Number(data.price);
  
  // 無料判定条件を厳密に評価
  return (
    data.is_free === true || // is_freeが明示的にtrueの場合
    numericPrice === 0 ||    // 価格が0の場合
    data.price === null ||   // 価格がnullの場合
    data.price === undefined || // 価格が未定義の場合
    isNaN(numericPrice)      // 価格が数値に変換できない場合
  );
}

/**
 * プロンプトが有料かどうかを判定
 * - is_free=false かつ price>0 かつ stripe_product_id または stripe_price_idが存在する場合に有料と判定
 */
export function isContentPremium(
  data: { 
    is_free?: boolean; 
    price?: number | string | null; 
    stripe_product_id?: string | null; 
    stripe_price_id?: string | null; 
  }
): boolean {
  // 価格を数値に変換（文字列や他の型の場合に対応）
  const numericPrice = data.price === null || data.price === undefined ? 0 : Number(data.price);
  
  // 有料判定条件を厳密に評価
  return (
    data.is_free !== true && // is_freeがtrue以外
    numericPrice > 0 &&      // 価格が0より大きい
    !isNaN(numericPrice) &&  // 価格が有効な数値
    Boolean(data.stripe_product_id || data.stripe_price_id) // StripeのIDがいずれか存在する
  );
}

/**
 * コンテンツ取得時の表示制御判定
 * - 無料コンテンツは常に全文表示
 * - 有料コンテンツは購入済みの場合のみ全文表示
 */
export function shouldShowFullContent(
  data: { 
    is_free?: boolean; 
    price?: number | string | null; 
    stripe_product_id?: string | null; 
    stripe_price_id?: string | null; 
  },
  isPurchased: boolean
): boolean {
  return isContentFree(data) || isPurchased;
}

/**
 * コンテンツ文字列の正規化
 * - 文字列、配列、または未定義のコンテンツを文字列に変換
 * - 改行や空白を保持して変換
 */
export function normalizeContentText(content: string | string[] | undefined | null): string {
  if (!content) return '';
  
  if (typeof content === 'string') {
    // 文字列の場合はそのまま返す（改行や空白を保持）
    return content;
  } else if (Array.isArray(content)) {
    // 配列の場合は改行で結合（各要素の改行も保持）
    return content.join('\n');
  } else {
    return '';
  }
} 