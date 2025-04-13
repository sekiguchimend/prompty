// components/BookmarkedArticles.jsx
import React from 'react';

const BookmarkedArticles = () => {
  return (
    <div className="bookmarked-articles">
      <h2>イイねした記事</h2>
      <div className="articles-list">
        {/* スキした記事の一覧がここに表示される */}
        <p>表示するイイねした記事はありません</p>
      </div>
    </div>
  );
};

export default BookmarkedArticles;
