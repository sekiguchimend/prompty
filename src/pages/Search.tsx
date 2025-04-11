
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromptGrid from '@/components/PromptGrid';
import { featuredPrompts, aiGeneratedPrompts } from '@/data/mockPrompts';
import { Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Simulate API call with a delay
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      // For demo purposes, filter the mock data based on the query
      const combinedPrompts = [...featuredPrompts, ...aiGeneratedPrompts];
      const filteredResults = combinedPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(query.toLowerCase()) || 
        prompt.user.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(filteredResults);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 pb-12">
        <div className="container px-4 py-6 sm:px-6 md:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              "<span className="text-prompty-primary">{query}</span>" の検索結果
            </h1>
            <p className="text-gray-500">
              {isLoading ? '検索中...' : `${results.length}件の結果が見つかりました`}
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prompty-primary"></div>
              <p className="mt-4 text-gray-500">検索中...</p>
            </div>
          ) : results.length > 0 ? (
            <PromptGrid prompts={results} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <SearchIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-medium mb-2">検索結果が見つかりませんでした</h2>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                別のキーワードで検索するか、キーワードの綴りを確認してみてください。
              </p>
              <Button onClick={() => window.history.back()}>前のページに戻る</Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Search;
