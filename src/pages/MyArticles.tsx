// MyArticles.tsx - メインページコンポーネント
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SidebarTabs from '../components/myArticle/SidebarTabs';
import LikedArticles from '../components/myArticle/LikedArticles';
import PurchasedArticles from '../components/myArticle/PurchasedArticles';
import BookmarkedArticles from '../components/myArticle/BookmarkedArticles';
import RecentlyViewedArticles from '../components/myArticle/RecentlyViewedArticles';
import '../styles/NotePage.css';
import Header from '../components/Header';
import { toast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabaseClient';
import { 
  Eye, Heart, MessageSquare, Edit, Trash2, 
  Copy, Plus, BookOpen, MoreHorizontal 
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

// プロンプトの型定義
interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  thumbnail_url: string | null;
  author_id?: string;  // user_idからauthor_idに変更
  category_id: number;
  is_premium: boolean;
  price: number | null;
  created_at: string;
  updated_at: string | null;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

const MyArticles = () => {
  const [activeTab, setActiveTab] = useState('myArticles');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const { tab } = router.query;

  // URLのクエリパラメータからタブを取得する
  useEffect(() => {
    // タブが指定されていれば、activeTabを更新
    if (tab && typeof tab === 'string') {
      // 有効なタブIDを確認
      const validTabs = ['myArticles', 'likedArticles', 'purchasedArticles', 'bookmarkedArticles', 'recentlyViewedArticles'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
        console.log(`タブを変更しました: ${tab}`);
      }
    }
  }, [tab]); // tabクエリパラメータに依存させる

  // ユーザープロフィールの取得
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setUserProfile({
          id: data.id,
          username: data.username || '',
          display_name: data.display_name || data.username || '',
          avatar_url: data.avatar_url || undefined
        });
      }
    } catch (error) {
      console.error('プロフィール情報の取得中にエラーが発生しました:', error);
    }
  };

  // プロンプトデータの取得
  useEffect(() => {
    if (activeTab === 'myArticles') {
      fetchMyPrompts();
    }
  }, [activeTab]);

  // プロンプトデータをSupabaseから取得
  const fetchMyPrompts = async () => {
    try {
      setLoading(true);
      console.log('プロンプト取得開始');
      
      // 現在ログインしているユーザーの取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('ユーザーがログインしていません');
        setLoading(false);
        return;
      }
      
      console.log('ログインユーザー取得成功:', user.id);
      
      // ユーザープロフィールを取得
      await fetchUserProfile(user.id);
      
      // UserProfilePage.tsxを参考に正しいカラム名を使用
      // ユーザーIDに基づいてプロンプトを取得
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          created_at,
          view_count,
          is_premium,
          price
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('プロンプト取得クエリ結果:', data ? `${data.length}件` : '0件', error ? `エラー: ${error.message}` : '');
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // まずは基本データだけで表示する（ローディングを解除するため）
        const basePrompts = data.map(prompt => ({
          ...prompt,
          content: '',  // 必要に応じて追加
          category_id: 0,  // 必要に応じて追加
          updated_at: null,  // 必要に応じて追加
          like_count: 0,
          comment_count: 0
        }));
        
        setMyPrompts(basePrompts);
        console.log('プロンプトデータを設定しました:', basePrompts.length);
        
        // いいね数とコメント数を取得
        await fetchLikesAndComments(data);
      } else {
        console.log('プロンプトが見つかりませんでした');
        setMyPrompts([]);
      }
      
      // ローディング状態を解除
      setLoading(false);
    } catch (error) {
      console.error('プロンプトの取得中にエラーが発生しました:', error);
      // エラーが発生した場合は空配列を設定
      setMyPrompts([]);
      // ローディング状態を必ず解除
      setLoading(false);
    }
  };
  
  // いいね数とコメント数を取得して更新する関数
  const fetchLikesAndComments = async (prompts: any[]) => {
    try {
      console.log('いいね数とコメント数の取得を開始');
      
      const updatedPrompts = await Promise.all(
        prompts.map(async (prompt) => {
          try {
            // いいね数を取得
            const { count: likeCount, error: likeError } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('prompt_id', prompt.id);
              
            if (likeError) {
              console.error(`プロンプト ${prompt.id} のいいね数取得エラー:`, likeError);
            }
            
            // コメント数を取得
            const { count: commentCount, error: commentError } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('prompt_id', prompt.id);
              
            if (commentError) {
              console.error(`プロンプト ${prompt.id} のコメント数取得エラー:`, commentError);
            }
            
            return {
              ...prompt,
              content: '',  // 必要に応じて追加
              category_id: 0,  // 必要に応じて追加
              updated_at: null,  // 必要に応じて追加
              like_count: likeCount || 0,
              comment_count: commentCount || 0
            };
          } catch (error) {
            console.error(`プロンプト ${prompt.id} の統計取得中にエラー:`, error);
            // エラーが発生しても基本データは返す
            return {
              ...prompt,
              content: '',  // 必要に応じて追加
              category_id: 0,  // 必要に応じて追加
              updated_at: null,  // 必要に応じて追加
              like_count: 0,
              comment_count: 0
            };
          }
        })
      );
      
      console.log('統計情報の取得完了:', updatedPrompts.length);
      
      // 更新されたプロンプト情報でステートを更新
      setMyPrompts(updatedPrompts);
    } catch (error) {
      console.error('統計情報の更新中にエラー:', error);
      // エラーは無視（基本データはすでに表示されている）
    }
  };

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}分前`;
      }
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // 記事の操作ハンドラー
  const handleEditArticle = (id: string) => {
    router.push(`/prompts/edit/${id}`);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm('このプロンプトを削除してもよろしいですか？\n関連するいいねやコメントなども全て削除されます。')) {
      return;
    }
    
    try {
      // トランザクションを開始してすべての削除を一度に行う
      console.log('プロンプト削除処理開始:', id);
      
      // 1. 関連するいいねを削除
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .eq('prompt_id', id);
        
      if (likesError) {
        console.error('いいねの削除中にエラーが発生しました:', likesError);
      } else {
        console.log('関連するいいねを削除しました');
      }
      
      // 2. 関連するコメントを削除
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('prompt_id', id);
        
      if (commentsError) {
        console.error('コメントの削除中にエラーが発生しました:', commentsError);
      } else {
        console.log('関連するコメントを削除しました');
      }
      
      // 3. プロンプト自体を削除
      const { error: promptError } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
        
      if (promptError) throw promptError;
      
      console.log('プロンプトを削除しました');
      
      // 削除後、リストから削除
      setMyPrompts(myPrompts.filter(prompt => prompt.id !== id));
      
      toast({
        title: "削除完了",
        description: "プロンプトとその関連データを完全に削除しました",
        variant: "default",
      });
    } catch (error) {
      console.error('プロンプトの削除中にエラーが発生しました:', error);
      toast({
        title: "削除エラー",
        description: "プロンプトの削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateArticle = async (id: string) => {
    try {
      // 複製するプロンプトを取得
      const promptToDuplicate = myPrompts.find(p => p.id === id);
      if (!promptToDuplicate) return;
      
      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // 新しいプロンプトとして保存
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          title: `${promptToDuplicate.title} (複製)`,
          description: promptToDuplicate.description,
          content: promptToDuplicate.content,
          thumbnail_url: promptToDuplicate.thumbnail_url,
          author_id: user.id,
          category_id: promptToDuplicate.category_id,
          is_premium: false, // 複製したプロンプトは最初は無料に
          price: promptToDuplicate.price
        })
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // 新しいプロンプトをリストに追加
        const newPrompt = {
          ...data[0],
          like_count: 0,
          comment_count: 0,
          view_count: 0
        };
        setMyPrompts([newPrompt, ...myPrompts]);
        
        toast({
          title: "複製完了",
          description: "プロンプトを複製しました",
        });
      }
    } catch (error) {
      console.error('プロンプトの複製中にエラーが発生しました:', error);
      toast({
        title: "複製エラー",
        description: "プロンプトの複製に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublishArticle = async (id: string) => {
    try {
      // 現在の状態を取得
      const prompt = myPrompts.find(p => p.id === id);
      if (!prompt) return;
      
      const newState = !prompt.is_premium;
      
      // 状態を更新
      const { error } = await supabase
        .from('prompts')
        .update({ is_premium: newState })
        .eq('id', id);
        
      if (error) throw error;
      
      // 状態を更新
      setMyPrompts(myPrompts.map(p => 
        p.id === id ? { ...p, is_premium: newState } : p
      ));
      
    toast({
        title: "状態を変更しました",
        description: `プロンプトを${newState ? '有料' : '無料'}に設定しました`,
    });
    } catch (error) {
      console.error('状態変更中にエラーが発生しました:', error);
    toast({
        title: "状態変更エラー",
        description: "プロンプトの状態変更に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 新規プロンプト作成画面へ遷移
  const handleCreateNewPrompt = () => {
    router.push('/prompts/create');
  };

  // タブコンテンツの選択ロジック
  const renderTabContent = () => {
    switch (activeTab) {
      case 'myArticles':
        // 自分の記事タブの内容はここに直接実装
        return (
            <div className="articles-container">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">あなたのプロンプト</h2>
              <Button 
                onClick={handleCreateNewPrompt} 
                className="px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                新規プロンプト作成
              </Button>
            </div>
              
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : myPrompts.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-4">まだプロンプトがありません</p>
                <Button 
                  onClick={handleCreateNewPrompt} 
                  className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800"
                >
                  最初のプロンプトを作成する
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {myPrompts.map(prompt => (
                  <article key={prompt.id} className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                      {prompt.thumbnail_url && (
                        <div className="md:w-40 h-40 md:h-28 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                          <img 
                            src={prompt.thumbnail_url || '/placeholder-image.jpg'} 
                            alt={prompt.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <Link href={`/prompts/${prompt.id}`} className="block">
                          <h2 className="text-base md:text-lg font-bold text-gray-800 hover:text-gray-600 mb-2 md:mb-3 line-clamp-2">
                            {prompt.title}
                          </h2>
                        </Link>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {prompt.description}
                        </p>
                        
                        <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
                          <span>{formatDate(prompt.created_at)}</span>
                          {prompt.is_premium && (
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                              ¥{prompt.price || 0}
                            </span>
                          )}
                  </div>
                        
                        <div className="flex items-center gap-4 text-gray-500 text-xs md:text-sm">
                          <div className="flex items-center">
                            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                            <span>{prompt.view_count || 0}</span>
                </div>
                          <div className="flex items-center">
                            <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                            <span>{prompt.like_count || 0}</span>
                </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                            <span>{prompt.comment_count || 0}</span>
              </div>
              
                          <div className="ml-auto flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-blue-600"
                              onClick={() => handleEditArticle(prompt.id)}
                            >
                              <Edit className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                              <span>編集</span>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDuplicateArticle(prompt.id)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  <span>複製</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTogglePublishArticle(prompt.id)}>
                                  {prompt.is_premium ? (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      <span>無料に設定</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      <span>有料に設定</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteArticle(prompt.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>削除</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                  </div>
                </div>
                </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      case 'likedArticles':
        return <LikedArticles />;
      case 'purchasedArticles':
        return <PurchasedArticles />;
      case 'bookmarkedArticles':
        return <BookmarkedArticles />;
      case 'recentlyViewedArticles':
        return <RecentlyViewedArticles />;
      default:
        return <div>タブを選択してください</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="note-page flex-1 pt-16">
        <div className="note-page-container">
          {/* 左サイドバー - タブメニュー */}
          <div className="note-sidebar">
            <h2 className="md:block hidden">コンテンツ</h2>
            <SidebarTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          {/* 中央コンテンツエリア */}
          <div className="note-content">
            <div className="note-content-header">
              <div className="import-export-buttons">
                <button className="import-button hidden md:flex">インポート</button>
                <button className="export-button hidden md:flex">エクスポート</button>
              </div>
            </div>
            
            {/* 選択されたタブのコンテンツを表示 */}
            <div className="tab-content">
              {renderTabContent()}
            </div>
          </div>
          
          {/* 右サイドバー - PC表示のみ */}
          <div className="note-right-sidebar hidden md:block">
            {/* プロフィール情報 */}
            {userProfile && (
              <div className="profile-card bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center mb-3">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={userProfile.avatar_url} />
                    <AvatarFallback>
                      {userProfile.display_name?.[0] || userProfile.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{userProfile.display_name || userProfile.username}</h3>
                    <p className="text-gray-500 text-sm">@{userProfile.username}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/profile')}
                >
                  プロフィールを表示
                </Button>
              </div>
            )}
            
            {/* 記事の公開タイミングバナー */}
            <div className="publish-timing-banner">
              <div className="timing-content">
                <h3>コンテンツの公開</h3>
                <p>タイミングの参考に</p>
              </div>
              <div className="timing-calendar">
                <span>新版カレンダー公開中</span>
              </div>
            </div>
            
            {/* 創作のヒント */}
            <div className="creation-hints">
              <h3>コンテンツのヒント</h3>
              <div className="hint-section">
                <h4>コンテンツを有料販売してみよう</h4>
                <p>有料コンテンツを作成する</p>
                <button className="hint-button">くわしくみる</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyArticles;