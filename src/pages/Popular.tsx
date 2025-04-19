import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import PromptGrid from '../components/PromptGrid';
import { useResponsive } from '../hooks/use-responsive';
import { Helmet } from 'react-helmet';
import { PromptItem } from '../pages/prompts/[id]';
import { supabase } from '../lib/supabaseClient';

const Popular: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularPrompts();
  }, []);

  // 人気のプロンプトをSupabaseから取得
  const fetchPopularPrompts = async () => {
    try {
      setLoading(true);
      
      // 実際のデータベースからプロンプトを取得
      // いいね数や閲覧数などでソートして人気順に取得する想定
      // ここでは作成日時の新しい順に取得
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          thumbnail_url,
          image_url,
          user_id,
          created_at,
          profiles(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // 各プロンプトのいいね数を取得
        const promptsWithLikes = await Promise.all(
          data.map(async (prompt) => {
            // いいね数を取得
            const { count, error: likeError } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('prompt_id', prompt.id);
              
            if (likeError) {
              console.error('いいね数取得エラー:', likeError);
              return null;
            }
            
            // profilesはJSONB配列として返却されるため、最初の要素を取得
            const profile = Array.isArray(prompt.profiles) && prompt.profiles.length > 0 
              ? prompt.profiles[0] 
              : null;
            
            return {
              id: prompt.id,
              title: prompt.title,
              thumbnailUrl: prompt.thumbnail_url || prompt.image_url || '/placeholder-image.jpg',
              user: {
                name: profile?.username || '未設定',
                avatarUrl: profile?.avatar_url || '/default-avatar.png'
              },
              postedAt: new Date(prompt.created_at).toLocaleDateString('ja-JP'),
              likeCount: count || 0,
              isLiked: false // 初期値はfalse、後でユーザーのいいね状態を取得して更新
            };
          })
        );
        
        // nullを除外して設定
        const validPrompts = promptsWithLikes.filter(Boolean) as PromptItem[];
        setPrompts(validPrompts);
        
        // ログインしているユーザーのいいね状態を取得
        fetchUserLikes(validPrompts);
      }
    } catch (error) {
      console.error('プロンプトの取得中にエラーが発生しました:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ユーザーのいいね状態を取得
  const fetchUserLikes = async (promptItems: PromptItem[]) => {
    try {
      // 現在ログインしているユーザーの取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return; // ログインしていない場合は何もしない
      }
      
      // いいねテーブルからユーザーのいいね情報を取得
      const { data, error } = await supabase
        .from('likes')
        .select('prompt_id')
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // いいね済みのプロンプトIDのセットを作成
        const likedPromptIds = new Set(data.map(like => like.prompt_id));
        
        // いいね状態を更新したプロンプトリストを作成
        const updatedPrompts = promptItems.map(prompt => ({
          ...prompt,
          isLiked: likedPromptIds.has(prompt.id)
        }));
        
        setPrompts(updatedPrompts);
      }
    } catch (error) {
      console.error('いいね状態の取得中にエラーが発生しました:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
     <div className="flex flex-col flex-1 md:ml-[240px]">

      <Helmet>
        <title>人気の記事 | prompty</title>
      </Helmet>
      <Header />
      <Sidebar />
      
      <div className="flex flex-1 pt-10">
        {/* PC画面でのみサイドバーのスペースを確保 */}
        
        <main className="flex-1 pb-12 overflow-x-hidden md:mt-0 mt-5">
          <div className="container px-4 py-6 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold mb-6">人気の記事</h1>
            <p className="text-gray-600 mb-8">
              多くのユーザーに読まれている人気記事を集めました。過去に投稿された中からトレンドの記事をご紹介します。
            </p>
            
            {loading ? (
              <div className="text-center py-10">読み込み中...</div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-10">記事がありません</div>
            ) : (
              <PromptGrid 
                prompts={prompts} 
                horizontalScroll={false} 
              />
            )}
          </div>
        </main>
      </div>
      
      <Footer />
      </div>
    </div>
  );
};

export default Popular; 