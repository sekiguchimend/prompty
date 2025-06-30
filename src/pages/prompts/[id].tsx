import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import Footer from '../../components/footer';
import { ChevronLeft, Edit, Download } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import PopularArticles from '../../components/popular-articles';
import AuthorSidebar from '../../components/prompt/AuthorSidebar';
import PromptContent from '../../components/prompt/PromptContent';
import PurchaseSection from '../../components/prompt/PurchaseSection';
import { getDetailPost, getPopularPosts, getPrevNextPosts } from '../../data/posts';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { PostItem } from '../../data/posts';
import { supabase } from '../../lib/supabaseClient';
import { supabaseAdmin } from '../../lib/supabaseAdminClient';
import { useRouter } from 'next/router';
import { recordPromptView } from '../../lib/recently-viewed-service';
import PurchaseDialog from '../../components/prompt/PurchaseDialog';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { FileText, Info } from 'lucide-react';
import { isContentFree, isContentPremium, normalizeContentText } from '../../utils/content-helpers';
import { checkPurchaseStatus } from '../../utils/purchase-helpers';
import Comments from '../../components/Comments/Comments';
import { toast, useToast } from '../../components/ui/use-toast';
import { DEFAULT_AVATAR_URL } from '../../components/index';
import Head from 'next/head';
import { generateSiteUrl, getDefaultOgImageUrl } from '../../utils/seo-helpers';

// PromptItemの型定義 - エクスポートする
export interface PromptItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  mediaType?: 'image' | 'video';
  user: {
    name: string;
    avatarUrl: string;
    account_name?: string;
  };
  postedAt: string;
  likeCount: number;
  views?: number; // 閲覧数を追加
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];  // タグの配列を追加
}

// 拡張された投稿アイテムの型定義
interface ExtendedPostItem extends PostItem {
  site_url?: string;
  description?: string;
  prompt_content?: string;
  is_free?: boolean;
  stripe_product_id?: string;
  stripe_price_id?: string;
  preview_lines?: number;
  mediaType?: 'image' | 'video';
  ai_model?: string;
}

// サーバーサイドレンダリングの最適化
export const getServerSideProps: GetServerSideProps = async ({ params, req, res, query }) => {
  // キャッシュ制御ヘッダーを設定（決済処理中でない場合のみ）
  const isPaymentCallback = query?.success === '1' || query?.success === '0';
  if (!isPaymentCallback) {
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=86400' // 5分キャッシュ、24時間は古いデータを返しながら更新
    );
  }
  
  const id = params?.id as string;
  
  if (!id) {
    return { notFound: true };
  }

  // UUIDの検証（簡略化）
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const formattedId = uuidPattern.test(id) ? id : `${id}-0000-0000-0000-000000000000`;
  
  try {
    // 環境変数チェック
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
      return { notFound: true };
    }

    // 基本的なプロンプトデータのみ取得（最適化）
    const { data: promptData, error } = await supabaseAdmin
    .from('prompts')
    .select(`
      id,
      title,
      thumbnail_url,
      media_type,
      content,
      prompt_content,
      created_at,
      price,
      author_id,
      view_count,
      site_url,
      description,
      is_free,
      stripe_product_id,
      stripe_price_id,
      preview_lines,
      ai_model,
      published
    `)
    .eq('id', formattedId)
    .single();
    
  if (error || !promptData) {
      return { notFound: true };
    }

    // 認証ユーザーを取得（非公開記事の所有者チェック用）
    let currentUserId = null;
    try {
      const authCookie = req.headers.cookie
        ?.split(';')
        .find(c => c.trim().startsWith('supabase-auth-token='))
        ?.split('=')[1];
      
      if (authCookie) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(authCookie);
        currentUserId = user?.id;
      }
    } catch (authError) {
      // 認証エラーは無視（ゲストユーザーの場合）
    }

    // 非公開記事のアクセス制御
    if (!promptData.published) {
      // 記事が非公開で、かつ作成者でない場合は404を返す
      if (!currentUserId || currentUserId !== promptData.author_id) {
        return { notFound: true };
      }
    }

    // プロフィール情報を別途取得（並列処理）
    const profilePromise = supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .eq('id', promptData.author_id)
      .single();
      
    // いいね数を並列取得
    const likePromise = supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_id', formattedId);

    // 人気記事を並列取得（プロフィール情報も含めて効率化）
    const popularPromise = supabaseAdmin
      .from('prompts')
      .select(`
        id, 
        title, 
        thumbnail_url, 
        media_type, 
        view_count, 
        created_at,
        author_id,
        profiles!inner (
          display_name,
          avatar_url
        )
      `)
      .order('view_count', { ascending: false })
      .limit(5);

    // 前後記事を並列取得（軽量化）
    const prevPromise = supabaseAdmin
      .from('prompts')
      .select('id, title, thumbnail_url, media_type, view_count, created_at')
      .lt('created_at', promptData.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const nextPromise = supabaseAdmin
      .from('prompts')
      .select('id, title, thumbnail_url, media_type, view_count, created_at')
      .gt('created_at', promptData.created_at)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // 並列実行で高速化
    const [profileResult, likeResult, popularResult, prevResult, nextResult] = await Promise.allSettled([
      profilePromise,
      likePromise,
      popularPromise,
      prevPromise,
      nextPromise
    ]);

    // プロフィール処理
    const profileData = profileResult.status === 'fulfilled' && profileResult.value.data 
      ? profileResult.value.data 
      : { display_name: '名無し', avatar_url: DEFAULT_AVATAR_URL, bio: '著者情報なし' };

    // いいね数処理
    const likeCount = likeResult.status === 'fulfilled' ? (likeResult.value.count || 0) : 0;

    // 人気記事処理
    const popularPosts = popularResult.status === 'fulfilled' && popularResult.value.data
      ? popularResult.value.data.map((post: any) => ({
          id: post.id,
          title: post.title,
          thumbnailUrl: post.thumbnail_url || '/images/default-thumbnail.svg',
          mediaType: post.media_type || 'image',
          views: post.view_count || 0,
          date: new Date(post.created_at).toLocaleDateString('ja-JP'),
          user: { name: '投稿者', avatarUrl: DEFAULT_AVATAR_URL },
          postedAt: new Date(post.created_at).toLocaleDateString('ja-JP'),
          likeCount: 0
        }))
      : [];

    // ビューカウントはクライアントサイドで処理（二重カウント防止）

    // 前後記事データ処理
    const prevPost = prevResult.status === 'fulfilled' && prevResult.value.data
      ? {
          id: prevResult.value.data.id,
          title: prevResult.value.data.title,
          thumbnailUrl: prevResult.value.data.thumbnail_url || '/images/default-thumbnail.svg',
          likeCount: prevResult.value.data.view_count || 0,
          postedAt: new Date(prevResult.value.data.created_at).toLocaleDateString('ja-JP'),
          user: { name: '投稿者', avatarUrl: DEFAULT_AVATAR_URL },
          content: []
        }
      : null;

    const nextPost = nextResult.status === 'fulfilled' && nextResult.value.data
      ? {
          id: nextResult.value.data.id,
          title: nextResult.value.data.title,
          thumbnailUrl: nextResult.value.data.thumbnail_url || '/images/default-thumbnail.svg',
          likeCount: nextResult.value.data.view_count || 0,
          postedAt: new Date(nextResult.value.data.created_at).toLocaleDateString('ja-JP'),
          user: { name: '投稿者', avatarUrl: DEFAULT_AVATAR_URL },
          content: []
        }
      : null;

    // 安全なデータ構築
  const postData: ExtendedPostItem = {
      id: promptData.id,
      title: promptData.title || 'タイトルなし',
      thumbnailUrl: promptData.thumbnail_url || '/images/default-thumbnail.svg',
      mediaType: promptData.media_type || 'image', // デフォルトは画像
    content: Array.isArray(promptData.content) ? promptData.content : [],
      prompt_content: promptData.prompt_content || '',
      price: promptData.price || 0,
      likeCount,
      postedAt: new Date(promptData.created_at).toLocaleDateString('ja-JP'),
      description: promptData.description || '',
    is_free: promptData.is_free === true,
      stripe_product_id: promptData.stripe_product_id || '',
      stripe_price_id: promptData.stripe_price_id || '',
    user: {
        userId: promptData.author_id,
      name: profileData.display_name,
      avatarUrl: profileData.avatar_url,
      bio: profileData.bio,
        publishedAt: new Date(promptData.created_at).toLocaleDateString('ja-JP'),
        website: promptData.site_url || 'https://example.com'
    },
      site_url: promptData.site_url || '',
      preview_lines: promptData.preview_lines || 0,
      ai_model: promptData.ai_model || ''
    };
  
  return {
    props: {
      postData,
      popularPosts,
      prevPost,
      nextPost
    }
  };

  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    // エラーの種類に応じて適切なレスポンスを返す
    if (error instanceof Error) {
      // ネットワークエラーやタイムアウトの場合
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          props: {
            error: 'ネットワークエラーが発生しました',
            postData: null,
            popularPosts: [],
            prevPost: null,
            nextPost: null
          }
        };
      }
    }
    
    return { notFound: true };
  }
};

// propsを受け取るようにコンポーネントを修正
const PromptDetail = ({ 
  postData, 
  popularPosts, 
  prevPost, 
  nextPost,
  error
}: { 
  postData: ExtendedPostItem | null; 
  popularPosts: PromptItem[]; 
  prevPost: PostItem | null;
  nextPost: PostItem | null;
  error?: string;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [prompt, setPrompt] = useState<ExtendedPostItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 閲覧履歴記録（一回のみ実行）
  const viewRecordedRef = useRef(false);

  // すべてのHooksを最初に定義（条件分岐の前）

  // ユーザー取得（最適化）
  useEffect(() => {
    let mounted = true;
    
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session && postData) {
          setCurrentUser(session.user);
          setIsAuthor(session.user.id === postData.user.userId);
        }
      } catch (error) {
      }
    };
    
    if (postData) {
      fetchUser();
    }
    
    return () => {
      mounted = false;
    };
  }, [postData?.user.userId]);

  // Stripe決済処理（最適化）
  useEffect(() => {
    if (!router.isReady || !currentUser || !postData?.id) return;
    
      const success = router.query.success === '1';
    if (!success) return;

    let mounted = true;
      
    const handleStripeSuccess = async () => {
        try {
          const isPurchased = await checkPurchaseStatus(currentUser.id, postData.id);
          
        if (mounted) {
          if (!isPurchased) {
            const { error } = await supabase
              .from('purchases')
              .insert({
                buyer_id: currentUser.id,
                prompt_id: postData.id,
                status: 'completed',
                amount: postData.price || 0,
                currency: 'jpy',
                created_at: new Date().toISOString()
              });
              
            if (!error && mounted) {
              setIsPaid(true);
              toast({
                title: '購入完了',
                description: 'コンテンツの購入が完了しました。',
                variant: 'default'
              });
            }
          } else {
            setIsPaid(true);
          }
            
          // URLクリーンアップ
            router.replace(`/prompts/${postData.id}`, undefined, { shallow: true });
          }
      } catch (error) {
      }
    };
    
    handleStripeSuccess();
    
    return () => {
      mounted = false;
    };
  }, [router.isReady, router.query.success, currentUser, postData?.id, router, toast]);

  // 購入状態確認（最適化）
  useEffect(() => {
    if (!currentUser || !postData?.id) return;
    
    let mounted = true;
    
    const checkPaid = async () => {
      try {
        const isPurchased = await checkPurchaseStatus(currentUser.id, postData.id);
        if (mounted) {
        setIsPaid(isPurchased);
        }
      } catch (error) {
      }
    };
    
    checkPaid();
    
    return () => {
      mounted = false;
    };
  }, [currentUser, postData?.id]);

  useEffect(() => {
    if (postData) {
      setPrompt(postData);
      setIsLoading(false);
    }
  }, [postData]);
  
  useEffect(() => {
    if (postData?.id && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      console.log('🎯 Recording view for prompt:', postData.id);
      recordPromptView(postData.id).catch(() => {
        // エラーは無視
      });
    }
  }, [postData?.id]);

  // 有料・無料判定（メモ化）
  const isFree = useMemo(() => postData ? isContentFree(postData) : false, [postData]);
  const isPremium = useMemo(() => postData ? isContentPremium(postData) : false, [postData]);
  
  // コンテンツ処理（メモ化）
  const { basicContent, premiumContent } = useMemo(() => {
    if (!postData) return { basicContent: '', premiumContent: '' };
    
    // Supabaseのデータをそのまま使用して改行・空白を保持
    const basic = postData.content;
    const premium = postData.prompt_content || '';
    
    // contentが配列の場合のみnormalizeContentTextを使用
    const processedBasic = Array.isArray(basic) 
      ? normalizeContentText(basic) 
      : (basic || '');
      
    return { 
      basicContent: processedBasic, 
      premiumContent: premium 
    };
  }, [postData?.content, postData?.prompt_content]);

  // データ変換（メモ化）
  const promptData = useMemo(() => {
    if (!postData) return null;
    
    return {
      ...postData,
      authorForSidebar: {
        name: postData.user.name,
        avatarUrl: postData.user.avatarUrl,
        bio: postData.user.bio || '著者情報なし',
        userId: postData.user.userId || ''
      },
      authorForContent: {
        name: postData.user.name,
        avatarUrl: postData.user.avatarUrl,
        bio: postData.user.bio || '著者情報なし',
        publishedAt: postData.user.publishedAt || '投稿日時なし',
        userId: postData.user.userId || ''
      }
    };
  }, [postData]);
  
  // PopularArticlesコンポーネントの型に合わせてデータを変換（メモ化）
  const popularArticles = useMemo(() => 
    popularPosts?.map((post: any) => ({
    id: post.id || '',
    title: post.title || 'タイトルなし',
    likes: post.likeCount || 0,
    views: post.views || 0, // 実際のビュー数を使用
    thumbnailUrl: post.thumbnailUrl || '/images/default-thumbnail.svg',
    mediaType: post.mediaType || 'image',
    date: post.date || post.postedAt || '不明'
    })) || []
  , [popularPosts]);

  // 前後の記事データも同様に変換
  const prevArticle = useMemo(() => prevPost ? {
    id: prevPost.id,
    title: prevPost.title,
    likes: prevPost.likeCount,
    thumbnailUrl: prevPost.thumbnailUrl,
    date: prevPost.postedAt
  } : null, [prevPost]);

  const nextArticle = useMemo(() => nextPost ? {
    id: nextPost.id,
    title: nextPost.title,
    likes: nextPost.likeCount,
    thumbnailUrl: nextPost.thumbnailUrl,
    date: nextPost.postedAt
  } : null, [nextPost]);

  // SEO用のメタデータを生成（記事固有の詳細情報）
  const generateSEOData = useCallback(() => {
    if (!postData) return { title: '', description: '', url: '', imageUrl: '', keywords: '' };
    
    // より具体的で魅力的なタイトル生成
    const title = `${postData.title} | ${postData.user.name}のAIプロンプト | Prompty`;
    
    // 詳細な説明文生成
    let description = '';
    if (postData.description) {
      // 説明文がある場合は活用
      description = `${postData.description.slice(0, 120)}...`;
    } else {
      // 説明文がない場合は自動生成
      const priceText = isFree ? '無料' : `¥${postData.price?.toLocaleString()}`;
      const categoryText = postData.ai_model ? `${postData.ai_model}対応` : 'AI';
      const contentPreview = postData.prompt_content ? 
        postData.prompt_content.replace(/\n/g, ' ').slice(0, 80) + '...' : '';
      
      description = `${categoryText}プロンプト「${postData.title}」を${priceText}でご利用いただけます。${contentPreview} 投稿者: ${postData.user.name}`;
    }
    
    const url = generateSiteUrl(`/prompts/${postData.id}`);
    
    // 画像URLを絶対URLに変換（外部アクセス対応強化）
    let imageUrl = getDefaultOgImageUrl(); // デフォルト画像
    
    if (postData.thumbnailUrl && !postData.thumbnailUrl.includes('default-thumbnail.svg')) {
      // カスタム画像がある場合
      if (postData.thumbnailUrl.startsWith('http://') || postData.thumbnailUrl.startsWith('https://')) {
        // 既に絶対URLの場合はそのまま使用
        imageUrl = postData.thumbnailUrl;
      } else if (postData.thumbnailUrl.startsWith('/')) {
        // 相対パスの場合は絶対URLに変換
        imageUrl = generateSiteUrl(postData.thumbnailUrl);
      } else {
        // Supabase等の外部ストレージの場合（プロトコルを明示的に追加）
        if (postData.thumbnailUrl.startsWith('//')) {
          imageUrl = `https:${postData.thumbnailUrl}`;
        } else if (!postData.thumbnailUrl.includes('://')) {
          // プロトコルがない場合はSupabaseのURLとして処理
          imageUrl = postData.thumbnailUrl.startsWith('qrxrulntwojimhhhnwqk.supabase.co') 
            ? `https://${postData.thumbnailUrl}` 
            : postData.thumbnailUrl;
        } else {
          imageUrl = postData.thumbnailUrl;
        }
      }
    }
    
    // キーワード生成（記事固有）
    const keywords = [
      'AIプロンプト',
      postData.title,
      postData.user.name,
      postData.ai_model || 'AI',
      isFree ? '無料プロンプト' : '有料プロンプト',
      'プロンプトエンジニアリング',
      'AI活用',
      'Prompty'
    ].filter(Boolean).join(',');
    
    return { title, description, url, imageUrl, keywords };
  }, [postData, isFree]);

  const seoData = generateSEOData();

  // YAMLダウンロード機能を追加
  const generateYamlContent = useCallback((postData: ExtendedPostItem) => {
    // プロンプト本文のみ（AIが再現するのに必要な唯一の情報）
    const yaml = `---
prompt: |
  ${postData.prompt_content?.split('\n').join('\n  ') || ''}
---`;
    
    return yaml;
  }, []);

  const handleDownloadYaml = useCallback((postData: ExtendedPostItem) => {
    const yamlContent = generateYamlContent(postData);
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // タイトルを安全なファイル名に変換
    const safeTitle = postData.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
    a.download = `${safeTitle}_prompt.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateYamlContent]);

  // 条件付きレンダリング（早期リターン）
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-white mt-14 md:mt-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 text-blue-600 hover:underline"
            >
              ホームに戻る
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 早期リターン処理の最適化
  if (router.isFallback) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-white mt-14 md:mt-4 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // データ検証の最適化
  if (!postData || !promptData) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-white mt-14 md:mt-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">プロンプトが見つかりませんでした</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 text-blue-600 hover:underline"
            >
              ホームに戻る
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 表示切替
  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={seoData.url} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={seoData.imageUrl} />
        <meta property="og:site_name" content="Prompty" />
        <meta property="article:author" content={postData.user.name} />
        <meta property="article:published_time" content={postData.postedAt} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={seoData.url} />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={seoData.imageUrl} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={seoData.url} />
        
        {/* Structured Data - 記事詳細情報付き */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Article", "Product"],
              "headline": postData.title,
              "name": postData.title,
              "description": seoData.description,
              "image": [seoData.imageUrl],
              "author": {
                "@type": "Person",
                "name": postData.user.name,
                "url": generateSiteUrl(`/users/${postData.user.account_name || postData.user.name}`)
              },
              "publisher": {
                "@type": "Organization",
                "name": "Prompty",
                "logo": {
                  "@type": "ImageObject",
                  "url": generateSiteUrl("/images/prompty_logo.jpg")
                }
              },
              "datePublished": postData.postedAt,
              "dateModified": postData.postedAt,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": seoData.url
              },
              "category": postData.ai_model || "AIプロンプト",
              "keywords": seoData.keywords,
              "offers": isPremium ? {
                "@type": "Offer",
                "price": postData.price,
                "priceCurrency": "JPY",
                "availability": "https://schema.org/InStock",
                "url": seoData.url,
                "seller": {
                  "@type": "Organization",
                  "name": "Prompty"
                }
              } : {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": postData.likeCount > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "reviewCount": postData.likeCount,
                "bestRating": "5",
                "worstRating": "1"
              } : undefined
            })
          }}
        />
      </Head>
      <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-white">
        <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
          {/* Back link and Edit link */}
          <div className="flex justify-between items-center mb-2 md:mb-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>戻る</span>
            </Link>
            
            <div className="flex items-center gap-2">
              {/* 編集ボタン - 作者のみ表示 */}
              {isAuthor && (
                <Link href={`/edit-prompt/${postData.id}`} className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors">
                  <Edit className="h-4 w-4 mr-1.5" />
                  編集する
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row">
            {/* Left sidebar - Author info (smaller) */}
            <div className="hidden md:block md:w-56 flex-shrink-0 pr-6">
              <div className="sticky top-20">
                <AuthorSidebar
                  author={promptData.authorForSidebar || DEFAULT_AVATAR_URL}
                  tags={promptData.tags || []}
                  website={promptData.user.website || ''}
                />
              </div>
            </div>
            
            {/* Main content (centered) */}
            <div className="flex-1 max-w-3xl mx-auto">
              {/* 本文部分 */}
              <PromptContent
                imageUrl={promptData.thumbnailUrl}
                mediaType={postData.mediaType}
                title={promptData.title}
                content={basicContent}
                premiumContent={premiumContent}
                author={promptData.authorForContent}
                price={Number(postData.price || 0)}
                systemImageUrl={promptData.systemImageUrl}
                systemUrl={postData.site_url || ''}
                description={postData.description}
                isPaid={isPaid}
                isPreview={!isFree && isPremium && !isPaid}
                isPremium={isPremium}
                reviewCount={postData.likeCount || 0}
                canDownloadYaml={!!(isFree || isPaid || isAuthor)}
                aiModel={postData.ai_model}
                onDownloadYaml={() => handleDownloadYaml(postData)}
                previewLines={postData.preview_lines || 3}
                likes={postData.likeCount || 0}
              />
            </div>
            
            {/* Empty right space for balance */}
            <div className="hidden md:block md:w-56 flex-shrink-0"></div>
          </div>
        </div>
        
      
        {/* Popular Articles Section */}
        <Separator className="my-12" />
        {popularArticles.length > 0 ? (
          <PopularArticles 
            articles={popularArticles} 
            prevArticle={prevArticle}
            nextArticle={nextArticle}
          />
        ) : (
          <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
            <h2 className="text-xl font-bold mb-6">人気記事</h2>
            <p className="text-gray-500 text-center py-6">現在、人気記事はありません</p>
          </div>
        )}
      </main>
      
      <Footer />
      </div>
    </>
  );
};

export default PromptDetail;