/**
 * SEO用のURL生成ヘルパー関数
 */

// 基本ドメインの設定（環境変数から取得、デフォルトはwww無し）
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'prompty-ai.com';
const PROTOCOL = process.env.NEXT_PUBLIC_PROTOCOL || 'https';

/**
 * 完全なURLを生成する
 * @param path - パス（例: '/search', '/users/123'）
 * @returns 完全なURL
 */
export const generateSiteUrl = (path: string = ''): string => {
  // パスが'/'で始まらない場合は追加
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${PROTOCOL}://${BASE_DOMAIN}${normalizedPath}`;
};

/**
 * 画像URLを生成する
 * @param imagePath - 画像パス（例: 'prompty_logo.jpg'）
 * @returns 完全な画像URL
 */
export const generateImageUrl = (imagePath: string): string => {
  // images/で始まらない場合は追加
  const normalizedPath = imagePath.startsWith('images/') ? imagePath : `images/${imagePath}`;
  return generateSiteUrl(`/${normalizedPath}`);
};

/**
 * デフォルトのOG画像URLを取得
 */
export const getDefaultOgImageUrl = (): string => {
  return generateImageUrl('prompty_logo.jpg');
};

/**
 * SEO用のメタデータを生成する
 * @param options - SEOオプション
 */
export interface SEOMetadata {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
}

export const generateSEOMetadata = (options: Partial<SEOMetadata> & { path?: string }): SEOMetadata => {
  const {
    title = 'Prompty｜プロンプトを売って、広めて、稼げる。新しいAI時代のマーケットプレイス',
    description = '業務効率化・自動返信・デザイン生成など、すぐに使えるプロンプトを多数掲載。誰でも気軽にAI活用を始められる、新しいプロンプト共有・販売プラットフォームです。',
    path = '',
    imageUrl,
    type = 'website',
    author,
    publishedTime
  } = options;

  return {
    title,
    description,
    url: generateSiteUrl(path),
    imageUrl: imageUrl || getDefaultOgImageUrl(),
    type,
    author,
    publishedTime
  };
}; 