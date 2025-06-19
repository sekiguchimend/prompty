import React, { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, BookOpen, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import VideoPlayer from './common/VideoPlayer';

interface Article {
  id: string;
  title: string;
  likes?: number; // いいね数（オプション）
  views?: number; // ページビュー数（オプション）
  date?: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video'; // メディアタイプ
}

interface PopularArticlesProps {
  articles: Article[];
  prevArticle?: Article | null;
  nextArticle?: Article | null;
}

const PopularArticles: React.FC<PopularArticlesProps> = ({ articles, prevArticle, nextArticle }) => {
  const [showMore, setShowMore] = useState(false);
  
  // 表示する記事の数を制限（初期状態では7つ、もっと見るをクリックしたら12つ）
  const displayArticles = showMore ? articles.slice(0, 12) : articles.slice(0, 7);
  
  // もっと見るボタンのクリックハンドラ
  const handleShowMore = () => {
    setShowMore(true);
  };
  
  // ビュー数が多い順に並べ替えた記事のトップ2を取得（ピックアップ用）
  const topPickedArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 2);
  
  return (
    <div className="mt-12 bg-white pt-6 pb-10">
      <div className="container px-4 md:px-8 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold mb-6">人気記事</h2>
        
        <div className="space-y-4">
          {displayArticles.map((article) => (
            <div key={article.id} className="flex items-start gap-3 py-2 border-b border-gray-100">
              <div className="flex-1 pr-2">
                <Link href={`/prompts/${article.id}`} className="group">
                  <h3 className="font-medium leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {article.date}
                    </p>
                  )}
                </Link>
                <div className="flex items-center mt-1 text-gray-500">
                  <Eye className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-sm">{article.views?.toLocaleString() || '0'}</span>
                </div>
              </div>
              {article.thumbnailUrl && (
                <div className="w-24 h-14 shrink-0 overflow-hidden rounded-md">
                  {article.mediaType === 'video' ? (
                    <VideoPlayer
                      src={article.thumbnailUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      hoverToPlay={false}
                      tapToPlay={false}
                      muted={true}
                      loop={false}
                      showThumbnail={true}
                      minimumOverlay={true} // 再生ボタンのみ表示
                      onLinkClick={() => {
                        window.location.href = `/prompts/${article.id}`;
                      }}
                    />
                  ) : (
                    <img 
                      src={article.thumbnailUrl} 
                      alt={article.title} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* もっと見るボタンは、全記事数が7より多く、かつまだ全部表示していない場合のみ表示 */}
        {articles.length > 7 && !showMore && (
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              className="text-sm text-gray-600"
              onClick={handleShowMore}
            >
              もっとみる
            </Button>
          </div>
        )}
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {prevArticle ? (
            <div className="border rounded-md p-5 flex-1">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-2">前の記事</h3>
                  <Link href={`/prompts/${prevArticle.id}`} className="text-lg font-medium leading-tight hover:text-blue-600 transition-colors line-clamp-2">
                    {prevArticle.title}
                  </Link>
                </div>
                <div className="pl-4">
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-5 flex-1 opacity-50">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-2">前の記事</h3>
                  <p className="text-lg font-medium leading-tight text-gray-400 line-clamp-2">
                    前の記事はありません
                  </p>
                </div>
                <div className="pl-4">
                  <ChevronLeft className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}
          
          {nextArticle ? (
            <div className="border rounded-md p-5 flex-1">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-2">次の記事</h3>
                  <Link href={`/prompts/${nextArticle.id}`} className="text-lg font-medium leading-tight hover:text-blue-600 transition-colors line-clamp-2">
                    {nextArticle.title}
                  </Link>
                </div>
                <div className="pl-4">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-5 flex-1 opacity-50">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-2">次の記事</h3>
                  <p className="text-lg font-medium leading-tight text-gray-400 line-clamp-2">
                    次の記事はありません
                  </p>
                </div>
                <div className="pl-4">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">ピックアップされています</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topPickedArticles.length > 0 ? (
              topPickedArticles.map((article) => (
                <Card key={article.id} className="border hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="flex-1 pr-1">
                        <Link href={`/prompts/${article.id}`} className="font-medium text-lg hover:text-blue-600 transition-colors">
                          {article.title}
                        </Link>
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Eye className="h-4 w-4 mr-1 text-gray-400" />
                          <span>{article.views?.toLocaleString() || '0'}回の閲覧</span>
                        </div>
                      </div>
                      {article.thumbnailUrl ? (
                        <div className="w-20 h-11 shrink-0 overflow-hidden rounded-md bg-purple-100">
                          {article.mediaType === 'video' ? (
                            <VideoPlayer
                              src={article.thumbnailUrl}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              hoverToPlay={false}
                              tapToPlay={false}
                              muted={true}
                              loop={false}
                              showThumbnail={true}
                              minimumOverlay={true} // 再生ボタンのみ表示
                              onLinkClick={() => {
                                window.location.href = `/prompts/${article.id}`;
                              }}
                            />
                          ) : (
                            <img 
                              src={article.thumbnailUrl} 
                              alt={article.title} 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-11 shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="border hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-lg text-gray-400">
                          ピックアップ記事はありません
                        </p>
                      </div>
                      <div className="w-16 h-28 shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-lg text-gray-400">
                          ピックアップ記事はありません
                        </p>
                      </div>
                      <div className="w-16 h-28 shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularArticles;
