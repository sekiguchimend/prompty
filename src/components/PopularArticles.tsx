import React from 'react';
import { Heart, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface Article {
  id: string;
  title: string;
  likes: number;
  date?: string;
  thumbnailUrl?: string;
}

interface PopularArticlesProps {
  articles: Article[];
}

const PopularArticles: React.FC<PopularArticlesProps> = ({ articles }) => {
  return (
    <div className="mt-12 bg-white pt-6 pb-10">
      <div className="container px-4 md:px-8 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold mb-6">人気記事</h2>
        
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="flex items-start gap-4 py-3 border-b border-gray-100">
              <div className="flex-1">
                <Link to={`/prompts/${article.id}`} className="group">
                  <h3 className="font-medium leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {article.date}
                    </p>
                  )}
                </Link>
                <div className="flex items-center mt-2 text-gray-500">
                  <Heart className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-sm">{article.likes.toLocaleString()}</span>
                </div>
              </div>
              {article.thumbnailUrl && (
                <div className="w-20 h-20 shrink-0 overflow-hidden rounded-md">
                  <img 
                    src={article.thumbnailUrl} 
                    alt={article.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-6">
          <Button variant="outline" className="text-sm text-gray-600">
            もっとみる
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border rounded-md p-5 flex-1">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-2">前の記事</h3>
                <Link to="#" className="text-lg font-medium leading-tight hover:text-blue-600 transition-colors line-clamp-2">
                  noteを書くだけで夢が動き出す—未来を引き寄せる言葉の力
                </Link>
              </div>
              <div className="pl-4">
                <ChevronLeft className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-5 flex-1">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-2">次の記事</h3>
                <Link to="#" className="text-lg font-medium leading-tight hover:text-blue-600 transition-colors line-clamp-2">
                  「これ言ったら嫌われるかも」の壁を越えたら、人生が劇的に面白くなった話
                </Link>
              </div>
              <div className="pl-4">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">ピックアップされています</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Link to="#" className="font-medium text-lg hover:text-blue-600 transition-colors">
                      目に止まったnote
                    </Link>
                    <div className="flex items-center mt-3 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>22,574本</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 shrink-0 overflow-hidden rounded-md bg-purple-100">
                    <img 
                      src="/lovable-uploads/4ed80f0e-6902-4a40-92fc-56fea3e5bd1c.png" 
                      alt="Open Book" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Link to="#" className="font-medium text-lg hover:text-blue-600 transition-colors">
                      先達に学ぶ描き方書き方届け方のコツ
                    </Link>
                    <div className="flex items-center mt-3 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>171本</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-gray-100">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularArticles;
