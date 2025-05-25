import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Footer from '../components/footer';
import PromptGrid from '../components/prompt-grid';
import { featuredPrompts, aiGeneratedPrompts } from '../data/mockPrompts';
import { Search as SearchIcon, ChevronDown, Filter, SortAsc, SortDesc, User, FileText, Tag, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PromptItem } from '../components/prompt-grid';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { supabase } from '../lib/supabaseClient';
import { Badge } from '../components/ui/badge';

// 検索オプションの型定義
type SortOption = 'relevance' | 'title_asc' | 'title_desc' | 'latest' | 'oldest' | 'popular';
type FilterType = 'all' | 'title' | 'author' | 'tag';

const Search = () => {
  const router = useRouter();
  const query = (router.query.q as string) || '';
  const [searchInput, setSearchInput] = useState(query);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<PromptItem[]>([]);
  const [filteredResults, setFilteredResults] = useState<PromptItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // 並び替えとフィルタリングのステート
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // 検索実行関数
  const executeSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setSearchError(null);
    
    try {
      // 実際のSupabaseからデータを取得
      if (!searchQuery.trim()) {
        // 検索クエリがない場合は最新の投稿を表示
        const { data: promptsData, error } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            content,
            created_at,
            price,
            author_id,
            view_count,
            profiles:profiles(id, username, display_name, avatar_url, bio)
          `)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) {
          setSearchError('データの取得中にエラーが発生しました');
          // エラー時はフォールバック処理を行う（後続のcatchブロックで処理）
          throw error;
        }
        
        // データ変換処理
        const formattedResults = transformPromptsData(promptsData || []);
        setResults(formattedResults);
        setFilteredResults(formattedResults);
      } else {
        // Supabaseから検索
        const { data: promptsData, error } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            content,
            created_at,
            price,
            author_id,
            view_count,
            profiles:profiles(id, username, display_name, avatar_url, bio)
          `)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false });
          
        if (error) {
          setSearchError('検索処理中にエラーが発生しました');
          throw error;
        }
        
        let formattedResults: PromptItem[] = [];
        
        if (!promptsData || promptsData.length === 0) {
          // プロフィール名での検索を試みる
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select(`
              id, 
              username,
              display_name,
              avatar_url
            `)
            .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
            
          if (!profilesError && profilesData && profilesData.length > 0) {
            // 見つかったプロフィールのユーザーIDで投稿を検索
            const userIds = profilesData.map(profile => profile.id);
            const { data: userPromptsData, error: userPromptsError } = await supabase
              .from('prompts')
              .select(`
                id,
                title,
                thumbnail_url,
                content,
                created_at,
                price,
                author_id,
                view_count,
                profiles:profiles(id, username, display_name, avatar_url, bio)
              `)
              .in('author_id', userIds)
              .order('created_at', { ascending: false });
              
            if (!userPromptsError && userPromptsData) {
              // データ変換処理
              formattedResults = transformPromptsData(userPromptsData);
              setResults(formattedResults);
              setFilteredResults(formattedResults);
              setIsLoading(false);
              return;
            }
          }
        } else {
          // データ変換処理
          formattedResults = transformPromptsData(promptsData);
        }
        
        if (formattedResults.length === 0) {
          // バックアップとしてモックデータから検索
          const combinedPrompts = [...featuredPrompts, ...aiGeneratedPrompts];
          const mockResults = combinedPrompts.filter(prompt => 
            prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prompt.user.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setResults(mockResults);
          setFilteredResults(mockResults);
        } else {
          setResults(formattedResults);
          setFilteredResults(formattedResults);
        }
      }
    } catch (error) {
      // エラー時の処理（コンソールログへの依存を排除）
      if (!searchError) {
        setSearchError('検索中にエラーが発生しました。しばらく経ってからお試しください。');
      }
      
      // エラー時はモックデータにフォールバック
      const combinedPrompts = [...featuredPrompts, ...aiGeneratedPrompts];
      const mockResults = combinedPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(mockResults);
      setFilteredResults(mockResults);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // searchParamsからクエリを取得
    const searchQuery = query;
    setSearchInput(searchQuery);
    
    // 少し遅延させて検索実行
    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]); // queryではなくsearchParamsの変更を監視
  
  // 検索結果の並び替えとフィルタリングを適用
  useEffect(() => {
    if (results.length === 0) return;
    
    let sorted = [...results];
    
    // 並び替え適用
    switch (sortOption) {
      case 'title_asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'latest':
        sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime());
        break;
      case 'popular':
        sorted.sort((a, b) => b.likeCount - a.likeCount);
        break;
      default:
        // relevanceはデフォルトの順序を使用
        break;
    }
    
    // フィルタリング適用
    if (filterType !== 'all' && query) {
      switch (filterType) {
        case 'title':
          sorted = sorted.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
          );
          break;
        case 'author':
          sorted = sorted.filter(item => 
            item.user.name.toLowerCase().includes(query.toLowerCase())
          );
          break;
        case 'tag':
          sorted = sorted.filter(item => 
            item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          );
          break;
      }
    }
    
    setFilteredResults(sorted);
  }, [results, sortOption, filterType, query]); // searchParamsの変更も監視

  // データ変換用ヘルパー関数
  const transformPromptsData = (promptsData: any[]): PromptItem[] => {
    if (!Array.isArray(promptsData)) return [];
    
    return promptsData.map(prompt => {
      try {
        const profileData = prompt.profiles && prompt.profiles.length > 0 
          ? prompt.profiles[0] 
          : { display_name: '不明なユーザー', avatar_url: '/images/default-avatar.svg' };
        
        return {
          id: prompt.id,
          title: prompt.title || '無題',
          thumbnailUrl: prompt.thumbnail_url || '/images/default-thumbnail.svg',
          content: prompt.content || [],
          postedAt: new Date(prompt.created_at).toLocaleDateString('ja-JP'),
          likeCount: prompt.like_count || 0,
          user: {
            userId: prompt.author_id || '',
            name: profileData.display_name || profileData.username || '不明なユーザー',
            avatarUrl: profileData.avatar_url || '/images/default-avatar.svg',
          }
        };
      } catch (err) {
        // データ変換エラー時のフォールバック
        return {
          id: prompt.id || 'unknown',
          title: prompt.title || '無題',
          thumbnailUrl: '/images/default-thumbnail.svg',
          content: [],
          postedAt: new Date().toLocaleDateString('ja-JP'),
          likeCount: 0,
          user: {
            userId: '',
            name: '不明なユーザー',
            avatarUrl: '/images/default-avatar.svg',
          }
        };
      }
    }).filter(Boolean); // nullやundefinedをフィルタリング
  };

  // 検索フォーム送信時の処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(searchInput.trim())}`;
      
      // 現在のURLと同じ検索クエリの場合、executeSearchを直接呼び出し
      if (query === searchInput.trim()) {
        executeSearch(searchInput.trim());
      } else {
        router.push(searchUrl);
      }
    }
  };

  // フィルタータイプを変更
  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type);
    
    // フィルターバッジを更新
    if (type === 'all') {
      setActiveFilters([]);
    } else if (!activeFilters.includes(type)) {
      setActiveFilters([...activeFilters, type]);
    }
  };

  // バッジを削除
  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
    setFilterType('all');
  };

  // フィルターの種類に応じた表示名を取得
  const getFilterDisplayName = (filter: string): string => {
    switch (filter) {
      case 'title': return 'タイトル';
      case 'author': return '投稿者';
      case 'tag': return 'タグ';
      default: return filter;
    }
  };

  return (
    <div className="min-h-screen bg-prompty-background">
      <main className="container max-w-7xl mx-auto px-4 py-8 pt-20">
        <h1 className="text-3xl font-bold mb-4">検索</h1>
        
        {/* 検索フォーム */}
      
       
        {/* 検索フィルターと並べ替えオプション */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* 検索フィルタードロップダウン */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                {filterType === 'all' ? 'すべて' : 
                 filterType === 'title' ? 'タイトル' : 
                 filterType === 'author' ? '作者' : 'タグ'}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>検索対象</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilterTypeChange('all')} className={filterType === 'all' ? 'bg-prompty-lightGray' : ''}>
                すべて
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterTypeChange('title')} className={filterType === 'title' ? 'bg-prompty-lightGray' : ''}>
                <FileText className="h-4 w-4 mr-2" />
                タイトル
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterTypeChange('author')} className={filterType === 'author' ? 'bg-prompty-lightGray' : ''}>
                <User className="h-4 w-4 mr-2" />
                作者
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterTypeChange('tag')} className={filterType === 'tag' ? 'bg-prompty-lightGray' : ''}>
                <Tag className="h-4 w-4 mr-2" />
                タグ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* 並び替えドロップダウン */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                {sortOption === 'relevance' ? <SearchIcon className="h-4 w-4" /> :
                 sortOption === 'title_asc' || sortOption === 'latest' ? <SortAsc className="h-4 w-4" /> :
                 <SortDesc className="h-4 w-4" />}
                {sortOption === 'relevance' ? '関連度順' : 
                 sortOption === 'title_asc' ? 'タイトル昇順' : 
                 sortOption === 'title_desc' ? 'タイトル降順' : 
                 sortOption === 'latest' ? '新しい順' : 
                 sortOption === 'oldest' ? '古い順' : '人気順'}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>並び替え</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOption('relevance')} className={sortOption === 'relevance' ? 'bg-prompty-lightGray' : ''}>
                <SearchIcon className="h-4 w-4 mr-2" />
                関連度順
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('title_asc')} className={sortOption === 'title_asc' ? 'bg-prompty-lightGray' : ''}>
                <SortAsc className="h-4 w-4 mr-2" />
                タイトル昇順
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('title_desc')} className={sortOption === 'title_desc' ? 'bg-prompty-lightGray' : ''}>
                <SortDesc className="h-4 w-4 mr-2" />
                タイトル降順
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('latest')} className={sortOption === 'latest' ? 'bg-prompty-lightGray' : ''}>
                <SortAsc className="h-4 w-4 mr-2" />
                新しい順
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('oldest')} className={sortOption === 'oldest' ? 'bg-prompty-lightGray' : ''}>
                <SortDesc className="h-4 w-4 mr-2" />
                古い順
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('popular')} className={sortOption === 'popular' ? 'bg-prompty-lightGray' : ''}>
                <SortDesc className="h-4 w-4 mr-2" />
                人気順
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* アクティブなフィルターの表示 */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {activeFilters.map(filter => (
                <Badge key={filter} className="bg-prompty-lightGray text-gray-800 flex items-center gap-1" variant="outline">
                  {getFilterDisplayName(filter)}
                  <button onClick={() => removeFilter(filter)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveFilters([])} 
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                すべて解除
              </Button>
            </div>
          )}
        </div>
        
        {/* 検索結果 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {query ? `「${query}」の検索結果: ${filteredResults.length}件` : '最新のプロンプト'}
          </h2>
          
          {/* エラーメッセージ表示 */}
          {searchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {searchError}
              </p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-prompty-primary"></div>
              <span className="ml-2 text-prompty-primary">検索中...</span>
            </div>
          ) : filteredResults.length > 0 ? (
            <PromptGrid prompts={filteredResults} />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <SearchIcon className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">検索結果が見つかりませんでした</h3>
              <p className="text-gray-500 mb-4">別のキーワードで検索してみてください</p>
              
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// 静的生成を強制してルーティングを確実にする
export async function getStaticProps() {
  return {
    props: {}
  };
}

export default Search;