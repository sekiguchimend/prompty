import { useEffect, useState } from 'react';

interface PromptData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  media_type: string | null;
}

export default function DebugThumbnails() {
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/prompts/featured-and-popular?limit=5');
        const data = await response.json();
        
        console.log('🔍 API応答データ:', data);
        
        if (data.success && data.data?.popularPrompts) {
          setPrompts(data.data.popularPrompts);
          console.log('📊 取得したプロンプト数:', data.data.popularPrompts.length);
          data.data.popularPrompts.forEach((prompt: PromptData) => {
            console.log(`- ${prompt.title}: thumbnail=${prompt.thumbnail_url}, media_type=${prompt.media_type}`);
          });
        }
      } catch (error) {
        console.error('❌ データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  if (loading) {
    return <div className="p-4">読み込み中...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">サムネイル デバッグページ</h1>
      
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="border p-4 rounded">
            <h3 className="font-bold">{prompt.title}</h3>
            <p>ID: {prompt.id}</p>
            <p>Thumbnail URL: {prompt.thumbnail_url || '(なし)'}</p>
            <p>Media Type: {prompt.media_type || '(なし)'}</p>
            
            {prompt.thumbnail_url && (
              <div className="mt-2">
                <p>サムネイル表示テスト:</p>
                <img 
                  src={prompt.thumbnail_url} 
                  alt={prompt.title}
                  className="w-32 h-20 object-cover border"
                  onError={() => console.log('❌ 画像読み込みエラー:', prompt.thumbnail_url)}
                  onLoad={() => console.log('✅ 画像読み込み成功:', prompt.thumbnail_url)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}