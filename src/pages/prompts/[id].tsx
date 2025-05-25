import React, { useEffect, useState, useMemo } from 'react';
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
import { toast } from '../../components/ui/use-toast';
import { DEFAULT_AVATAR_URL } from '../../components/common/Avatar';

// PromptItemの型定義 - エクスポートする
export interface PromptItem {
  id: string;
  title: string;
  thumbnailUrl: string;
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
}

// サーバーサイドレンダリングの最適化
export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const id = params?.id as string;
  
  if (!id) {
    return { notFound: true };
  }

  // UUIDの検証（簡略化）
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const formattedId = uuidPattern.test(id) ? id : `${id}-0000-0000-0000-000000000000`;
  
  try {
    // 基本的なプロンプトデータのみ取得（最適化）
    const { data: promptData, error } = await supabaseAdmin
    .from('prompts')
    .select(`
      id,
      title,
      thumbnail_url,
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
      stripe_price_id
    `)
    .eq('id', formattedId)
    .single();
    
  if (error || !promptData) {
      return { notFound: true };
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

    // 人気記事を並列取得（軽量化）
    const popularPromise = supabaseAdmin
      .from('prompts')
      .select('id, title, thumbnail_url, view_count, created_at')
      .order('view_count', { ascending: false })
      .limit(5);

    // 前後記事を並列取得（軽量化）
    const prevPromise = supabaseAdmin
      .from('prompts')
      .select('id, title, thumbnail_url, view_count, created_at')
      .lt('created_at', promptData.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const nextPromise = supabaseAdmin
      .from('prompts')
      .select('id, title, thumbnail_url, view_count, created_at')
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
          views: post.view_count || 0,
          date: new Date(post.created_at).toLocaleDateString('ja-JP'),
          user: { name: '投稿者', avatarUrl: DEFAULT_AVATAR_URL },
          postedAt: new Date(post.created_at).toLocaleDateString('ja-JP'),
          likeCount: 0
        }))
      : [];

    // 軽量なビューカウント更新（非同期、エラー無視）
    setImmediate(async () => {
      try {
        const currentViewCount = promptData.view_count || 0;
        await supabaseAdmin
          .from('prompts')
          .update({ view_count: currentViewCount + 1 })
          .eq('id', formattedId);
      } catch (e) {
        // ビューカウント更新はサイレントに失敗させる
      }
    });

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
      site_url: promptData.site_url || ''
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
    console.error("データ取得エラー:", error);
    return { notFound: true };
  }
};

// propsを受け取るようにコンポーネントを修正
const PromptDetail = ({ 
  postData, 
  popularPosts, 
  prevPost, 
  nextPost 
}: { 
  postData: ExtendedPostItem; 
  popularPosts: PromptItem[]; 
  prevPost: PostItem | null;
  nextPost: PostItem | null;
}) => {
  const router = useRouter();  
  const [prompt, setPrompt] = useState<ExtendedPostItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  // ユーザー取得（最適化）
  useEffect(() => {
    let mounted = true;
    
    const fetchUser = async () => {
      try {
      const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session) {
        setCurrentUser(session.user);
        setIsAuthor(session.user.id === postData.user.userId);
        }
      } catch (error) {
        console.error('ユーザー取得エラー:', error);
      }
    };
    
    fetchUser();
    
    return () => {
      mounted = false;
    };
  }, [postData.user.userId]);

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
        console.error('決済処理エラー:', error);
      }
    };
    
    handleStripeSuccess();
    
    return () => {
      mounted = false;
    };
  }, [router.isReady, router.query.success, currentUser, postData?.id]);

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
        console.error("購入確認エラー:", error);
      }
    };
    
    checkPaid();
    
    return () => {
      mounted = false;
    };
  }, [currentUser, postData?.id]);

  // 早期リターン処理の最適化
  if (router.isFallback) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-white mt-14 md:mt-10 flex items-center justify-center">
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
  if (!postData) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-white mt-14 md:mt-10 flex items-center justify-center">
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
  
  // 有料・無料判定（メモ化）
  const isFree = useMemo(() => isContentFree(postData), [postData]);
  const isPremium = useMemo(() => isContentPremium(postData), [postData]);
  
  // コンテンツ処理（メモ化）
  const { basicContent, premiumContent } = useMemo(() => {
    const basic = normalizeContentText(postData.content);
    const premium = postData.prompt_content || '';
    return { basicContent: basic, premiumContent: premium };
  }, [postData.content, postData.prompt_content]);

  // データ変換（メモ化）
  const promptData = useMemo(() => ({
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
      publishedAt: postData.user.publishedAt || '投稿日時なし'
    }
  }), [postData]);
  
  // PopularArticlesコンポーネントの型に合わせてデータを変換（メモ化）
  const popularArticles = useMemo(() => 
    popularPosts?.map((post: any) => ({
    id: post.id || '',
    title: post.title || 'タイトルなし',
    likes: post.likeCount || 0,
    views: post.views > 0 ? post.views : Math.floor(Math.random() * 500) + 50, // 0の場合はランダムな値を設定
    thumbnailUrl: post.thumbnailUrl || '/images/default-thumbnail.svg',
    date: post.date || post.postedAt || '不明'
    })) || []
  , [popularPosts]);

  // 前後の記事データも同様に変換
  const prevArticle = prevPost ? {
    id: prevPost.id,
    title: prevPost.title,
    likes: prevPost.likeCount,
    thumbnailUrl: prevPost.thumbnailUrl,
    date: prevPost.postedAt
  } : null;

  const nextArticle = nextPost ? {
    id: nextPost.id,
    title: nextPost.title,
    likes: nextPost.likeCount,
    thumbnailUrl: nextPost.thumbnailUrl,
    date: nextPost.postedAt
  } : null;

  useEffect(() => {
    if (postData) {
      setPrompt(postData);
      setIsLoading(false);
    }
  }, [postData]);
  
  // 閲覧履歴記録（一回のみ実行）
  useEffect(() => {
    if (postData?.id) {
      recordPromptView(postData.id).catch(() => {
        // エラーは無視
      });
    }
  }, [postData?.id]);

  // YAMLダウンロード機能を追加
  const generateYamlContent = (postData: ExtendedPostItem) => {
    // プロンプト本文のみ（AIが再現するのに必要な唯一の情報）
    const yaml = `---
prompt: |
  ${postData.prompt_content?.split('\n').join('\n  ') || ''}
---`;
    
    return yaml;
  };

  const handleDownloadYaml = (postData: ExtendedPostItem) => {
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
  };

  // 表示切替
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-white">
        <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
          {/* Back link and Edit link */}
          <div className="flex justify-between items-center mb-2 md:mb-6 mt-4 md:mt-0">
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
                canDownloadYaml={isFree || isPaid || isAuthor}
                onDownloadYaml={() => handleDownloadYaml(postData)}
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
  );
};

export default PromptDetail;