import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PromptGrid from '../components/PromptGrid';
import { featuredPrompts, aiGeneratedPrompts } from '../data/mockPrompts';
import { Search as SearchIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PromptItem } from '../components/PromptGrid';

const Search = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<PromptItem[]>([]);

  useEffect(() => {
    setSearchInput(query);
    
    // Simulate API call with a delay
    setIsLoading(true);
    console.log('🔍 検索クエリ:', query);
    
    const timer = setTimeout(() => {
      // For demo purposes, filter the mock data based on the query
      const combinedPrompts = [...featuredPrompts, ...aiGeneratedPrompts];
      
      // 検索クエリがない場合は全件表示
      if (!query.trim()) {
        setResults(combinedPrompts);
        setIsLoading(false);
        return;
      }
      
      const filteredResults = combinedPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(query.toLowerCase()) ||
        prompt.user.name.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log('🔍 検索結果:', filteredResults.length, '件');
      setResults(filteredResults);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(searchInput.trim())}`;
      
      // 現在のURLと同じ検索クエリの場合、強制的にページをリロード
      if (searchParams?.get('q') === searchInput.trim()) {
        window.location.href = searchUrl; // 完全なページリロード
      } else {
        router.push(searchUrl);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 pb-12 mt-12">
        <div className="container px-4 py-6 sm:px-6 md:px-8">
          <form onSubmit={handleSearch} className="mb-6 flex">
            <div className="relative flex-1 max-w-lg">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="キーワードやクリエイターで検索"
                className="w-full pl-10"
              />
            </div>
            <Button type="submit" className="ml-2">検索</Button>
          </form>
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {query ? `"${query}" の検索結果` : "すべての検索結果"}
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