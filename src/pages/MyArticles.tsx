// MyArticles.tsx - メインページコンポーネント
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SidebarTabs from '../components/myArticle/SidebarTabs';
import LikedArticles from '../components/myArticle/LikedArticles';
import PurchasedArticles from '../components/myArticle/PurchasedArticles';
import BookmarkedArticles from '../components/myArticle/BookmarkedArticles';
import RecentlyViewedArticles from '../components/myArticle/RecentlyViewedArticles';
import ArticleDropdownMenu from '../components/ArticleDropdownMenu';
import ArticleActionsMenu from '../components/ArticleActionsMenu';
import '../styles/NotePage.css';
import Header from '../components/Header';
import { toast } from '../components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../lib/auth-context';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 記事の型定義
interface Article {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const MyArticles = () => {
  const [activeTab, setActiveTab] = useState('myArticles');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { tab } = router.query;
  const { user } = useAuth();

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

  // 自分の記事を取得する
  useEffect(() => {
    const fetchMyArticles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setMyArticles(data || []);
        setLoading(false);
      } catch (error) {
        console.error('記事の取得エラー:', error);
        setError('記事の読み込みに失敗しました。後でもう一度お試しください。');
        setLoading(false);
      }
    };
    
    if (activeTab === 'myArticles') {
      fetchMyArticles();
    }
  }, [activeTab, user]);

  // 記事の操作ハンドラー
  const handleEditArticle = (id: string) => {
    router.push(`/edit-prompt/${id}`);
    toast({
      title: "編集",
      description: `記事ID: ${id} を編集します`,
    });
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('この記事を削除してもよろしいですか？')) {
      try {
        const { error } = await supabase
          .from('prompts')
          .delete()
          .eq('id', id);
          
        if (error) {
          throw error;
        }
        
        // 記事リストから削除した記事を除外
        setMyArticles(prev => prev.filter(article => article.id !== id));
        
        toast({
          title: "削除",
          description: `記事を削除しました`,
          variant: "destructive",
        });
      } catch (error) {
        console.error('記事削除エラー:', error);
        toast({
          title: "エラー",
          description: `記事の削除に失敗しました`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicateArticle = async (id: string) => {
    try {
      // 対象の記事を取得
      const { data, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        throw fetchError;
      }
      
      // タイトルに「(コピー)」を追加
      const duplicatedTitle = `${data.title} (コピー)`;
      
      // 新しい記事として保存
      const { data: newPrompt, error: insertError } = await supabase
        .from('prompts')
        .insert({
          ...data,
          id: undefined, // 新しいIDを生成させる
          title: duplicatedTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (insertError) {
        throw insertError;
      }
      
      // 記事リストに新しい記事を追加
      setMyArticles(prev => [newPrompt[0], ...prev]);
      
      toast({
        title: "複製",
        description: `記事を複製しました`,
      });
    } catch (error) {
      console.error('記事複製エラー:', error);
      toast({
        title: "エラー",
        description: `記事の複製に失敗しました`,
        variant: "destructive",
      });
    }
  };

  const handleTogglePublishArticle = async (id: string) => {
    try {
      // 対象の記事を特定
      const article = myArticles.find(a => a.id === id);
      if (!article) return;
      
      // 公開状態を切り替え
      const newPublishState = !article.published;
      
      // データベース更新
      const { error } = await supabase
        .from('prompts')
        .update({ published: newPublishState })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // 記事リストの状態を更新
      setMyArticles(prev => 
        prev.map(a => a.id === id ? {...a, published: newPublishState} : a)
      );
      
      toast({
        title: newPublishState ? "公開" : "非公開",
        description: `記事を${newPublishState ? "公開" : "非公開"}にしました`,
      });
    } catch (error) {
      console.error('公開状態変更エラー:', error);
      toast({
        title: "エラー",
        description: `公開状態の変更に失敗しました`,
        variant: "destructive",
      });
    }
  };

  const handleArchiveArticle = (id: string) => {
    toast({
      title: "アーカイブ",
      description: `記事ID: ${id} をアーカイブしました`,
    });
  };

  // 複数選択時の一括操作ハンドラー
  const handleBulkDelete = async () => {
    if (window.confirm(`選択した${selectedArticles.length}件の記事を削除してもよろしいですか？`)) {
      try {
        const { error } = await supabase
          .from('prompts')
          .delete()
          .in('id', selectedArticles);
          
        if (error) {
          throw error;
        }
        
        // 記事リストから削除した記事を除外
        setMyArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)));
        setSelectedArticles([]);
        
        toast({
          title: "一括削除",
          description: `${selectedArticles.length}件の記事を削除しました`,
          variant: "destructive",
        });
      } catch (error) {
        console.error('一括削除エラー:', error);
        toast({
          title: "エラー",
          description: `記事の一括削除に失敗しました`,
          variant: "destructive",
        });
      }
    }
  };

  const handleBulkDuplicate = () => {
    toast({
      title: "一括複製",
      description: `${selectedArticles.length}件の記事を複製しました`,
    });
  };

  const handleBulkPublish = async () => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ published: true })
        .in('id', selectedArticles);
        
      if (error) {
        throw error;
      }
      
      // 記事リストの状態を更新
      setMyArticles(prev => 
        prev.map(a => selectedArticles.includes(a.id) ? {...a, published: true} : a)
      );
      
      toast({
        title: "一括公開",
        description: `${selectedArticles.length}件の記事を公開しました`,
      });
    } catch (error) {
      console.error('一括公開エラー:', error);
      toast({
        title: "エラー",
        description: `記事の一括公開に失敗しました`,
        variant: "destructive",
      });
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ published: false })
        .in('id', selectedArticles);
        
      if (error) {
        throw error;
      }
      
      // 記事リストの状態を更新
      setMyArticles(prev => 
        prev.map(a => selectedArticles.includes(a.id) ? {...a, published: false} : a)
      );
      
      toast({
        title: "一括非公開",
        description: `${selectedArticles.length}件の記事を非公開にしました`,
      });
    } catch (error) {
      console.error('一括非公開エラー:', error);
      toast({
        title: "エラー",
        description: `記事の一括非公開に失敗しました`,
        variant: "destructive",
      });
    }
  };

  const handleBulkArchive = () => {
    toast({
      title: "一括アーカイブ",
      description: `${selectedArticles.length}件の記事をアーカイブしました`,
    });
  };

  // チェックボックスの変更をハンドリング
  const handleCheckboxChange = (articleId: string) => {
    setSelectedArticles(prev => {
      if (prev.includes(articleId)) {
        return prev.filter(id => id !== articleId);
      } else {
        return [...prev, articleId];
      }
    });
  };

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // タブコンテンツの選択ロジック
  const renderTabContent = () => {
    switch (activeTab) {
      case 'myArticles':
        // 自分の記事タブの内容をSupabaseから取得したデータで表示
        return (
            <div className="articles-container">
              {selectedArticles.length > 0 && (
                <ArticleActionsMenu
                  selectedCount={selectedArticles.length}
                  onDelete={handleBulkDelete}
                  onDuplicate={handleBulkDuplicate}
                  onPublish={handleBulkPublish}
                  onUnpublish={handleBulkUnpublish}
                  onArchive={handleBulkArchive}
                />
              )}
              
              <div className="articles-header">
                <h2>{myArticles.length} 記事</h2>
              <div className="filter-controls">
                <div className="status-dropdown">
                  <button>公開ステータス <span>▼</span></button>
                </div>
                <div className="period-dropdown">
                  <button>期間 <span>▼</span></button>
                </div>
                <div className="magazine-dropdown">
                  <button>マガジン <span>▼</span></button>
                </div>
              </div>
            </div>
            
            <div className="articles-list">
              {loading ? (
                <p className="text-center py-6">読み込み中...</p>
              ) : error ? (
                <p className="text-center py-6 text-red-500">{error}</p>
              ) : myArticles.length > 0 ? (
                myArticles.map((article) => (
                  <div key={article.id} className="article-item">
                    <input 
                      type="checkbox" 
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => handleCheckboxChange(article.id)}
                    />
                    <div className="article-content">
                      <h3>{article.title}</h3>
                      {article.description && <p>{article.description}</p>}
                      <div className="article-meta">
                        <span className={article.published ? "published-indicator" : "draft-indicator"}>
                          {article.published ? '公開中' : '下書き'}
                        </span>
                        <span className="date">{formatDate(article.created_at)}</span>
                      </div>
                    </div>
                    {article.thumbnail_url && (
                      <div className="article-thumbnail">
                        <img src={article.thumbnail_url} alt={article.title} />
                      </div>
                    )}
                    <ArticleDropdownMenu 
                      articleId={article.id}
                      isPublished={article.published}
                      onEdit={handleEditArticle}
                      onDelete={handleDeleteArticle}
                      onDuplicate={handleDuplicateArticle}
                      onTogglePublish={handleTogglePublishArticle}
                      onArchive={handleArchiveArticle}
                    />
                  </div>
                ))
              ) : (
                <div className="empty-state p-6 text-center">
                  <p className="text-gray-500">表示する記事がありません</p>
                  <button 
                    onClick={() => router.push('/create-prompt')}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    新しい記事を作成
                  </button>
                </div>
              )}
            </div>
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