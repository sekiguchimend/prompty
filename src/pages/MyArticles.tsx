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

const MyArticles = () => {
  const [activeTab, setActiveTab] = useState('myArticles');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
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

  // 記事の操作ハンドラー
  const handleEditArticle = (id: string) => {
    toast({
      title: "編集",
      description: `記事ID: ${id} を編集します`,
    });
  };

  const handleDeleteArticle = (id: string) => {
    toast({
      title: "削除",
      description: `記事ID: ${id} を削除しました`,
      variant: "destructive",
    });
  };

  const handleDuplicateArticle = (id: string) => {
    toast({
      title: "複製",
      description: `記事ID: ${id} を複製しました`,
    });
  };

  const handleTogglePublishArticle = (id: string) => {
    toast({
      title: "公開状態の変更",
      description: `記事ID: ${id} の公開状態を変更しました`,
    });
  };

  const handleArchiveArticle = (id: string) => {
    toast({
      title: "アーカイブ",
      description: `記事ID: ${id} をアーカイブしました`,
    });
  };

  // 複数選択時の一括操作ハンドラー
  const handleBulkDelete = () => {
    if (window.confirm(`選択した${selectedArticles.length}件の記事を削除してもよろしいですか？`)) {
      toast({
        title: "一括削除",
        description: `${selectedArticles.length}件の記事を削除しました`,
        variant: "destructive",
      });
      setSelectedArticles([]);
    }
  };

  const handleBulkDuplicate = () => {
    toast({
      title: "一括複製",
      description: `${selectedArticles.length}件の記事を複製しました`,
    });
  };

  const handleBulkPublish = () => {
    toast({
      title: "一括公開",
      description: `${selectedArticles.length}件の記事を公開しました`,
    });
  };

  const handleBulkUnpublish = () => {
    toast({
      title: "一括非公開",
      description: `${selectedArticles.length}件の記事を非公開にしました`,
    });
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

  // タブコンテンツの選択ロジック
  const renderTabContent = () => {
    switch (activeTab) {
      case 'myArticles':
        // 自分の記事タブの内容はここに直接実装
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
                <h2>3 記事</h2>
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
              {/* 記事アイテム1 */}
              <div className="article-item">
                <input 
                  type="checkbox" 
                  checked={selectedArticles.includes('1')}
                  onChange={() => handleCheckboxChange('1')}
                />
                <div className="article-content">
                  <h3>ふふふ</h3>
                  <p>ふふふ</p>
                  <div className="article-meta">
                    <span className="draft-indicator">下書き</span>
                    <span className="date">2025年4月12日 08:48</span>
                  </div>
                </div>
                <ArticleDropdownMenu 
                  articleId="1"
                  isPublished={false}
                  onEdit={handleEditArticle}
                  onDelete={handleDeleteArticle}
                  onDuplicate={handleDuplicateArticle}
                  onTogglePublish={handleTogglePublishArticle}
                  onArchive={handleArchiveArticle}
                />
              </div>
              
              {/* 記事アイテム2 */}
              <div className="article-item">
                <input 
                  type="checkbox" 
                  checked={selectedArticles.includes('2')}
                  onChange={() => handleCheckboxChange('2')}
                />
                <div className="article-content">
                  <h3>18歳で未経験な自分でも案件を獲得できたわけ</h3>
                  <div className="article-meta">
                    <span className="published-indicator">公開中</span>
                    <span className="date">2024年10月25日 16:01</span>
                  </div>
                </div>
                <div className="article-thumbnail">
                  <img src="/path/to/thumbnail1.jpg" alt="サムネイル" />
                </div>
                <ArticleDropdownMenu 
                  articleId="2"
                  isPublished={true}
                  onEdit={handleEditArticle}
                  onDelete={handleDeleteArticle}
                  onDuplicate={handleDuplicateArticle}
                  onTogglePublish={handleTogglePublishArticle}
                  onArchive={handleArchiveArticle}
                />
              </div>
              
              {/* 記事アイテム3 */}
              <div className="article-item">
                <input 
                  type="checkbox" 
                  checked={selectedArticles.includes('3')}
                  onChange={() => handleCheckboxChange('3')}
                />
                <div className="article-content">
                  <h3>塾の悩みを解決？！生徒の「遅刻、事故、授業の存在を忘れる」を事前に知れるアプリ</h3>
                  <div className="article-meta">
                    <span className="published-indicator">公開中</span>
                    <span className="date">2024年10月25日 15:16</span>
                  </div>
                </div>
                <div className="article-thumbnail">
                  <img src="/path/to/thumbnail2.jpg" alt="サムネイル" />
                </div>
                <ArticleDropdownMenu 
                  articleId="3"
                  isPublished={true}
                  onEdit={handleEditArticle}
                  onDelete={handleDeleteArticle}
                  onDuplicate={handleDuplicateArticle}
                  onTogglePublish={handleTogglePublishArticle}
                  onArchive={handleArchiveArticle}
                />
              </div>
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