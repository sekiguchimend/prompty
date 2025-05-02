import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ChevronLeft } from 'lucide-react';
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
import { useRouter } from 'next/router';
import { recordPromptView } from '../../lib/recently-viewed-service';

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
  
  // Supabaseからプロンプトデータを取得 - IDで検索
  let { data: promptData, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      thumbnail_url,
      content,
      created_at,
      price,
      author_id,
      view_count,
      profiles:profiles(id, username, display_name, avatar_url, bio),
      site_url,
      description
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
        const { data: altData, error: altError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            content,
            created_at,
            price,
            author_id,
            view_count,
            profiles:profiles(id, username, display_name, avatar_url, bio),
            site_url,
            description
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
      const { data: viewData, error: viewError } = await supabase
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
          await supabase
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
        if (viewError.code === '42P01') { // リレーションが存在しない
          console.log("analytics_viewsテーブルが存在しません");
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
      
      await supabase
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
  const { count: likeCount, error: likeError } = await supabase
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
    const { data: directProfile, error: profileError } = await supabase
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
    price: safeGetNumber(promptData.price),
    likeCount: safeGetNumber(likeCount),
    postedAt: new Date(safeGetString(promptData.created_at)).toLocaleDateString('ja-JP'),
    description: safeGetString(promptData.description, ''),
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
  
  // 404処理
  if (router.isFallback) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
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
        <Header />
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-white">
        <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center text-gray-500 mb-6 mt-10 md:mt-0">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">戻る</span>
          </Link>
          
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
              <PromptContent
                imageUrl={promptData.thumbnailUrl}
                title={promptData.title}
                content={promptData.content || []}
                author={promptData.authorForContent}
                price={promptData.price || 0}
                systemImageUrl={promptData.systemImageUrl}
                systemUrl={postData.site_url || ''}
                description={postData.description}
              />
              
              {/* Purchase section */}
              <PurchaseSection
                wordCount={promptData.wordCount || 0}
                price={promptData.price || 0}
                tags={promptData.tags || []}
                reviewers={promptData.reviewers || []}
                reviewCount={promptData.reviewCount || 0}
                likes={promptData.likeCount}
                author={promptData.authorForPurchase}
                socialLinks={promptData.socialLinks || []}
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