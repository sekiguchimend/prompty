// components/LikedArticles.jsx
import React from 'react';
import { Heart, MoreVertical } from 'lucide-react';

// ダミーデータ
const likedArticles = [
  {
    id: '101',
    title: 'AIプロンプトエンジニアリングの基礎と応用',
    author: 'テックマスター',
    publishedAt: '2024年10月15日',
    likeCount: 42,
    imageSrc: 'https://source.unsplash.com/random/200x150?ai'
  },
  {
    id: '102',
    title: 'ミッドジャーニーで作る美しい風景画像の作り方：プロンプト集',
    author: 'デザイナーA',
    publishedAt: '2024年10月10日',
    likeCount: 35,
    imageSrc: 'https://source.unsplash.com/random/200x150?landscape'
  },
  {
    id: '103',
    title: 'ChatGPT-4で小説を書くためのプロンプト設計術',
    author: '作家B',
    publishedAt: '2024年10月5日',
    likeCount: 28,
    imageSrc: 'https://source.unsplash.com/random/200x150?novel'
  }
];

const LikedArticles = () => {
  return (
    <div className="liked-articles">
      <div className="articles-container">
        <div className="articles-header">
          <h2>{likedArticles.length} 記事</h2>
          <div className="filter-controls">
            <div className="period-dropdown">
              <button>期間 <span>▼</span></button>
            </div>
          </div>
        </div>
        
        <div className="articles-list">
          {likedArticles.length > 0 ? (
            likedArticles.map((article) => (
              <div key={article.id} className="article-item">
                <div className="article-content">
                  <h3>{article.title}</h3>
                  <div className="article-meta">
                    <span>{article.author}</span>
                    <span className="date">{article.publishedAt}</span>
                  </div>
                  <div className="article-actions mt-2 flex items-center">
                    <button className="flex items-center text-rose-500 mr-3">
                      <Heart className="h-4 w-4 mr-1 fill-rose-500" />
                      <span className="text-xs">{article.likeCount}</span>
                    </button>
                  </div>
                </div>
                {article.imageSrc && (
                  <div className="article-thumbnail">
                    <img src={article.imageSrc} alt={article.title} />
                  </div>
                )}
                <button className="more-options">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state p-6 text-center">
              <p className="text-gray-500">表示する高評価記事はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikedArticles;






