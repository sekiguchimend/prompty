import React, { useEffect, useState } from 'react';
import Footer from '../../components/Footer';
import { ChevronLeft, Edit } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import PopularArticles from '../../components/PopularArticles';
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

// サーバーサイドレンダリングに変更
export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const id = params?.id as string;
  
  if (!id) {
    console.error("IDが指定されていません");
    return {
      notFound: true,
    };
  }

  // UUIDの検証とフォーマット
  let formattedId = id;
  
  // UUIDのフォーマットチェック (例: 123e4567-e89b-12d3-a456-426614174000)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidPattern.test(id)) {
    // 短いIDをUUID形式に変換する試み
    if (/^[0-9a-f]{8}$/i.test(id)) {
      // 8桁のIDを標準UUIDに拡張
      formattedId = `${id}-0000-0000-0000-000000000000`;
    } else {
      console.error("無効なID形式:", id);
      return {
        notFound: true,
      };
    }
  }
  
  // Supabaseからプロンプトデータを取得 - IDで検索（サーバーサイド用クライアント使用）
  let { data: promptData, error } = await supabaseAdmin
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
      profiles:profiles(id, username, display_name, avatar_url, bio),
      site_url,
      description,
      is_free,
      stripe_product_id,
      stripe_price_id
    `)
    .eq('id', formattedId)
    .single();
    
  // IDで見つからない場合は代替クエリを試行
  if (error && error.code === '22P02') {
    try {
      // シーケンシャルIDや他の形式のIDを使用している場合
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        // 数値IDで検索を試みる
        const { data: altData, error: altError } = await supabaseAdmin
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
            profiles:profiles(id, username, display_name, avatar_url, bio),
            site_url,
            description,
            is_free,
            stripe_product_id,
            stripe_price_id
          `)
          .eq('numeric_id', numericId) // 数値ID用のカラムがある場合（例: numeric_id）
          .single();
          
        if (!altError && altData) {
         
          promptData = altData;
          error = altError; // nullになるはず
        }
      }
    } catch (e) {
      console.error("代替検索中のエラー:", e);
    }
  }
    
    
  // プロンプトが見つからない、またはエラーが発生した場合は404を返す
  if (error || !promptData) {
    console.error("プロンプト取得エラー:", error);
    return {
      notFound: true,
    };
  }
  
  // ビューカウントを更新 - より安全で堅牢な実装
  try {
    // 訪問者IDを取得 (クッキーまたはIPアドレス)
    const clientIP = ((req.headers['x-forwarded-for'] || '') as string).split(',')[0] || 
                     req.socket.remoteAddress || 
                     'unknown';
    const visitorId = (req.cookies?.visitor_id as string) || clientIP;
    
    // 現在の日付を取得 (YYYY-MM-DD形式)
    const today = new Date().toISOString().split('T')[0];
    
    // ビュー数を更新する必要があるかどうかを判定
    let shouldUpdateViewCount = false;
    
    try {
      // analytics_viewsテーブルがあるか確認
      const { data: viewData, error: viewError } = await supabaseAdmin
        .from('analytics_views')
        .select('id')
        .eq('prompt_id', formattedId)
        .eq('visitor_id', visitorId)
        .gte('viewed_at', today)
        .limit(1);
        
      if (!viewError) {
        // テーブルが存在し、今日の閲覧記録がない場合
        if (!viewData || viewData.length === 0) {
          shouldUpdateViewCount = true;
          
          // analytics_viewsテーブルに記録
          await supabaseAdmin
            .from('analytics_views')
            .insert([{
              prompt_id: formattedId,
              visitor_id: visitorId,
              viewed_at: new Date().toISOString()
            }])
            .then(({ error }) => {
              if (error) {
                console.error("ビュー履歴記録エラー:", error);
              }
            });
        }
      } else {
        // テーブルが存在しない場合など、エラーの場合は直接カウントアップ
        console.log("analytics_viewsテーブルエラー:", viewError.code, viewError.message);
        if (viewError.code === '42P01' || viewError.message.includes('does not exist')) { // リレーションが存在しない
          console.log("analytics_viewsテーブルが存在しないか、カラムに問題があります");
          shouldUpdateViewCount = true;
        } else {
          console.error("ビュー履歴チェックエラー:", viewError);
          shouldUpdateViewCount = true; // エラーの場合もカウントしておく
        }
      }
    } catch (e) {
      console.error("ビュー履歴処理エラー:", e);
      shouldUpdateViewCount = true; // エラーの場合もカウントしておく
    }
    
    // ビューカウントの更新が必要な場合
    if (shouldUpdateViewCount) {
      const currentViewCount = typeof promptData.view_count === 'number' ? promptData.view_count : 0;
      
      await supabaseAdmin
        .from('prompts')
        .update({ view_count: currentViewCount + 1 })
        .eq('id', formattedId)
        .then(({ error }) => {
          if (error) {
            console.error("ビューカウント更新エラー:", error);
          }
        });

      // ユーザーがログインしている場合、prompt_viewsテーブルに閲覧履歴を記録
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (userId) {
          // prompt_viewsテーブルに閲覧履歴を記録
          const { error: promptViewError } = await supabase
            .from('prompt_views')
            .upsert({
              user_id: userId,
              prompt_id: formattedId,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,prompt_id',
              ignoreDuplicates: false // 既存レコードを更新
            });
            
          if (promptViewError) {
            console.error("閲覧履歴記録エラー:", promptViewError);
          } else {
            console.log("閲覧履歴を保存しました:", userId, formattedId);
          }
        }
      } catch (e) {
        console.error("閲覧履歴保存処理エラー:", e);
      }
    }
  } catch (e) {
    console.error("ビューカウントシステムエラー:", e);
    // エラーでもメイン処理は続行
  }
  
  // いいね数を取得
  const { count: likeCount, error: likeError } = await supabaseAdmin
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_id', formattedId);
    
  if (likeError) {
    console.error("いいね数取得エラー:", likeError);
  }
    
  // 人気記事を取得
  const popularPosts = await getPopularPosts();
  
  // 前後の記事を取得
  const { prev: prevPost, next: nextPost } = await getPrevNextPosts(formattedId);
  
  // プロフィールデータの取得と処理
  let authorProfile = null;
  if (promptData.profiles) {
    // profilesが配列の場合の対応
    if (Array.isArray(promptData.profiles) && promptData.profiles.length > 0) {
      authorProfile = promptData.profiles[0];
    } 
    // profilesがオブジェクトの場合の対応
    else if (typeof promptData.profiles === 'object' && promptData.profiles !== null) {
      authorProfile = promptData.profiles;
    }
  }
  
  // プロフィールデータが取得できない場合、著者IDで直接取得を試みる
  if (!authorProfile && promptData.author_id) {
    const { data: directProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .eq('id', promptData.author_id)
      .single();
      
    if (!profileError && directProfile) {
      authorProfile = directProfile;
    } else {
      console.error("プロフィール直接取得エラー:", profileError);
    }
  }

  // 安全な方法でデータを抽出
  const safeGetString = (value: any, defaultValue: string = ''): string => {
    return typeof value === 'string' ? value : defaultValue;
  };
  
  const safeGetNumber = (value: any, defaultValue: number = 0): number => {
    return typeof value === 'number' ? value : defaultValue;
  };

  // authorProfileからプロパティを安全に取得
  const getProfileData = (profile: any): { display_name: string, avatar_url: string, bio: string } => {
    if (!profile) {
      return { display_name: '名無し', avatar_url: '/images/default-avatar.svg', bio: '著者情報なし' };
    }
    
    // プロフィールが配列の場合は最初の要素を使用
    const profileData = Array.isArray(profile) && profile.length > 0 ? profile[0] : profile;
    
    return {
      display_name: safeGetString(profileData.display_name, '名無し'),
      avatar_url: safeGetString(profileData.avatar_url, '/images/default-avatar.svg'),
      bio: safeGetString(profileData.bio, '著者情報なし')
    };
  };

  // プロフィールデータを安全に取得
  const profileData = getProfileData(authorProfile);

  const postData: ExtendedPostItem = {
    id: safeGetString(promptData.id),
    title: safeGetString(promptData.title),
    thumbnailUrl: safeGetString(promptData.thumbnail_url, '/images/default-thumbnail.svg'),
    content: Array.isArray(promptData.content) ? promptData.content : [],
    prompt_content: safeGetString(promptData.prompt_content, ''),
    price: safeGetNumber(promptData.price),
    likeCount: safeGetNumber(likeCount),
    postedAt: new Date(safeGetString(promptData.created_at)).toLocaleDateString('ja-JP'),
    description: safeGetString(promptData.description, ''),
    is_free: promptData.is_free === true,
    stripe_product_id: safeGetString(promptData.stripe_product_id),
    stripe_price_id: safeGetString(promptData.stripe_price_id),
    user: {
      userId: safeGetString(promptData.author_id),
      name: profileData.display_name,
      avatarUrl: profileData.avatar_url,
      bio: profileData.bio,
      publishedAt: new Date(safeGetString(promptData.created_at)).toLocaleDateString('ja-JP'),
      website: safeGetString(promptData.site_url, 'https://example.com')
    },
    site_url: safeGetString(promptData.site_url)
  };
  
  // 訪問者IDをクッキーに設定
  if (!req.cookies?.visitor_id) {
    // ランダムな訪問者IDを生成
    const randomId = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    // resオブジェクトを使用してクッキーを設定
    res.setHeader('Set-Cookie', `visitor_id=${randomId}; Path=/; Max-Age=31536000; SameSite=Strict`);
  }
  
  return {
    props: {
      postData,
      popularPosts,
      prevPost,
      nextPost
    }
  };
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

  // ユーザー取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        // 現在のユーザーが投稿者と同じかどうかチェック
        setIsAuthor(session.user.id === postData.user.userId);
      }
    };
    fetchUser();
  }, [postData.user.userId]);

  // URL検証とStripe決済完了後の処理
  useEffect(() => {
    const checkStripeSuccess = async () => {
      const success = router.query.success === '1';
      
      // Stripeから成功してリダイレクトされた場合
      if (success && currentUser && postData?.id) {
        try {
          console.log('Stripe決済成功後の処理を実行します');
          
          // まず購入状態を確認
          const isPurchased = await checkPurchaseStatus(currentUser.id, postData.id);
          
          // まだ購入レコードがない場合は作成
          if (!isPurchased) {
            console.log('購入レコードがないため作成します');
            
            // purchases テーブルに直接購入レコードを追加
            const { error: purchaseError } = await supabase
              .from('purchases')
              .insert({
                buyer_id: currentUser.id,
                prompt_id: postData.id,
                status: 'completed',
                amount: postData.price || 0,
                currency: 'jpy',
                created_at: new Date().toISOString()
              });
              
            if (purchaseError) {
              console.error('購入レコード作成エラー:', purchaseError);
              toast({
                title: '注意',
                description: '購入処理に問題が発生しました。しばらくしてからページを再読み込みしてください。',
                variant: 'destructive'
              });
            } else {
              console.log('購入レコードを作成しました:', postData.id);
              setIsPaid(true);
              toast({
                title: '購入完了',
                description: 'コンテンツの購入が完了しました。全文をご覧いただけます。',
                variant: 'default'
              });
              
              // URLからクエリパラメータを削除
              router.replace(`/prompts/${postData.id}`, undefined, { shallow: true });
            }
          } else {
            // 既に購入済みの場合
            setIsPaid(true);
            console.log('すでに購入済みです');
            
            // URLからクエリパラメータを削除
            router.replace(`/prompts/${postData.id}`, undefined, { shallow: true });
          }
        } catch (e) {
          console.error('Stripe決済後の処理エラー:', e);
        }
      }
    };
    
    if (router.isReady) {
      checkStripeSuccess();
    }
  }, [router.isReady, router.query, currentUser, postData?.id]);

  // 購入済み判定
  useEffect(() => {
    const checkPaid = async () => {
      if (!currentUser || !postData?.id) return;
      
      try {
        // 新しいヘルパー関数を使用して購入状態を確認
        const isPurchased = await checkPurchaseStatus(currentUser.id, postData.id);
        setIsPaid(isPurchased);
      } catch (e) {
        console.error("購入確認処理エラー:", e);
        setIsPaid(false);
      }
    };
    checkPaid();
  }, [currentUser, postData?.id]);

  // 404処理
  if (router.isFallback) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-white mt-14 md:mt-10 flex items-center justify-center">
          <p>読み込み中...</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  // データチェック
  if (!postData) {
    console.error("postDataが見つかりません");
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-white mt-14 md:mt-10 flex items-center justify-center">
          <p>プロンプト情報を読み込めませんでした</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  // コンポーネントの型に合わせて整形
  const promptData = {
    ...postData,
    // AuthorSidebarの型に合わせる
    authorForSidebar: {
      name: postData.user.name,
      avatarUrl: postData.user.avatarUrl,
      bio: postData.user.bio || '著者情報なし', // 必須項目
      userId: postData.user.userId || '' // ユーザーID追加
    },
    // PromptContentの型に合わせる
    authorForContent: {
      name: postData.user.name,
      avatarUrl: postData.user.avatarUrl,
      bio: postData.user.bio || '著者情報なし', // 必須項目
      publishedAt: postData.user.publishedAt || '投稿日時なし' // 必須項目
    },
    // PurchaseSectionの型に合わせる
    authorForPurchase: {
      name: postData.user.name,
      avatarUrl: postData.user.avatarUrl,
      bio: postData.user.bio || '著者情報なし', // 必須項目
      website: postData.user.website || 'https://example.com', // 必須項目
      userId: postData.user.userId || '' // ユーザーID追加
    }
  };
  
  // PopularArticlesコンポーネントの型に合わせてデータを変換
  const popularArticles = popularPosts?.map((post: PromptItem) => ({
    id: post.id || '',
    title: post.title || 'タイトルなし',
    likes: post.likeCount || 0,
    thumbnailUrl: post.thumbnailUrl || '/images/default-thumbnail.svg',
    date: post.postedAt || '不明'
  })) || [];

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
  
  // 閲覧履歴を記録する
  useEffect(() => {
    if (prompt && prompt.id && !isLoading) {
      // 閲覧履歴を記録
      recordPromptView(prompt.id).catch(error => {
        console.error('閲覧履歴の記録に失敗しました:', error);
      });
    }
  }, [prompt, isLoading]);

  // 有料・無料判定
  console.log('price:', postData.price, 'is_free:', postData.is_free);
  // ヘルパー関数を使用して有料・無料判定を行う
  const isFree = isContentFree(postData);
  const isPremium = isContentPremium(postData);
  console.log('isFree:', isFree, 'isPremium:', isPremium, 'price type:', typeof postData.price);
  console.log('prompt_content:', Boolean(postData.prompt_content), 'content:', Boolean(postData.content?.length));

  // 有料記事のコンテンツ制御準備
  // contentは常に表示される部分（無料部分）
  // prompt_contentは有料部分で、購入済み/無料記事の場合のみ表示される
  const basicContent = normalizeContentText(postData.content);
  const premiumContent = postData.prompt_content || '';

  // 表示切替
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-white">
        <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
          {/* Back link and Edit link */}
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>戻る</span>
            </Link>
            
            {isAuthor && (
              <Link href={`/edit-prompt/${postData.id}`} className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors">
                <Edit className="h-4 w-4 mr-1.5" />
                編集する
              </Link>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row">
            {/* Left sidebar - Author info (smaller) */}
            <div className="hidden md:block md:w-56 flex-shrink-0 pr-6">
              <div className="sticky top-20">
                <AuthorSidebar
                  author={promptData.authorForSidebar}
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