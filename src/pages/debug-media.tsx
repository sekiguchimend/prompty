import React, { useState, useEffect } from 'react';

interface PromptItem {
  id: string;
  title: string;
  thumbnail_url?: string;
  media_type?: string;
  created_at: string;
}

const DebugMediaPage: React.FC = () => {
  const [featuredPrompts, setFeaturedPrompts] = useState<PromptItem[]>([]);
  const [popularPrompts, setPopularPrompts] = useState<PromptItem[]>([]);
  const [categoryPrompts, setCategoryPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        // featured-and-popular APIの確認
        const featuredResponse = await fetch('/api/prompts/featured-and-popular?limit=5');
        if (!featuredResponse.ok) {
          throw new Error('Featured API error');
        }
        const featuredData = await featuredResponse.json();
        
        setFeaturedPrompts(featuredData.featuredPrompts || []);
        setPopularPrompts(featuredData.popularPrompts || []);
        
        // by-category APIの確認
        const categoryResponse = await fetch('/api/prompts/by-category');
        if (!categoryResponse.ok) {
          throw new Error('Category API error');
        }
        const categoryData = await categoryResponse.json();
        
        setCategoryPrompts([
          ...(categoryData.specialCategories || []),
          ...(categoryData.regularCategories || [])
        ]);
        
      } catch (err) {
        console.error('❌ データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">読み込み中...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">エラー: {error}</div>;
  }

  const renderPromptInfo = (prompt: PromptItem) => (
    <div key={prompt.id} className="border p-4 rounded mb-4">
      <h4 className="font-bold">{prompt.title}</h4>
      <div className="text-sm text-gray-600 mt-2">
        <div><strong>ID:</strong> {prompt.id}</div>
        <div><strong>thumbnail_url:</strong> {prompt.thumbnail_url || 'なし'}</div>
        <div><strong>media_type:</strong> {prompt.media_type || 'なし'}</div>
        <div><strong>created_at:</strong> {prompt.created_at}</div>
      </div>
      {prompt.thumbnail_url && (
        <div className="mt-2">
          <div className="text-sm font-medium mb-1">サムネイル表示:</div>
          {prompt.media_type === 'video' ? (
            <video 
              src={prompt.thumbnail_url} 
              className="w-32 h-20 object-cover border"
              controls
              muted
            />
          ) : (
            <img 
              src={prompt.thumbnail_url} 
              alt={prompt.title}
              className="w-32 h-20 object-cover border"
            />
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">メディアタイプデバッグページ</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">フィーチャープロンプト</h2>
        {featuredPrompts.length > 0 ? (
          featuredPrompts.map(renderPromptInfo)
        ) : (
          <p className="text-gray-500">フィーチャープロンプトがありません</p>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">人気プロンプト</h2>
        {popularPrompts.length > 0 ? (
          popularPrompts.map(renderPromptInfo)
        ) : (
          <p className="text-gray-500">人気プロンプトがありません</p>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">カテゴリ別プロンプト</h2>
        {categoryPrompts.length > 0 ? (
          categoryPrompts.map((category, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-lg font-medium mb-3">{category.category?.name || 'カテゴリ名不明'}</h3>
              {category.prompts && category.prompts.length > 0 ? (
                category.prompts.slice(0, 3).map(renderPromptInfo)
              ) : (
                <p className="text-gray-500">このカテゴリにはプロンプトがありません</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">カテゴリ別プロンプトがありません</p>
        )}
      </div>
    </div>
  );
};

export default DebugMediaPage;