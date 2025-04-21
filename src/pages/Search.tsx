import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PromptGrid from '../components/PromptGrid';
import { featuredPrompts, aiGeneratedPrompts } from '../data/mockPrompts';
import { Search as SearchIcon, ChevronDown, Filter, SortAsc, SortDesc, User, FileText, Tag, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PromptItem } from '../components/PromptGrid';
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<PromptItem[]>([]);
  const [filteredResults, setFilteredResults] = useState<PromptItem[]>([]);
  
  // 並び替えとフィルタリングのステート
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    // searchParamsからクエリを取得していることを明示的にログ出力
    const searchQuery = searchParams?.get('q') || '';
    console.log('📥 Search.tsx: 検索ページでクエリパラメータ取得:', searchQuery);
    setSearchInput(searchQuery);
    
    // Simulate API call with a delay
    setIsLoading(true);
    console.log('🔍 検索クエリ:', searchQuery);
    
    const fetchSearchResults = async () => {
      try {
        // 実際のSupabaseからデータを取得
        if (!searchQuery.trim()) {
          // 検索クエリがない場合は最新の投稿を表示
          console.log('🔍 検索クエリがないため、最新の投稿を表示します');
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
            console.error('Supabase検索エラー:', error);
            throw error;
          }
          
          // データ変換処理
          const formattedResults = transformPromptsData(promptsData || []);
          console.log('🔍 最新の投稿:', formattedResults.length, '件');
          setResults(formattedResults);
          setFilteredResults(formattedResults);
        } else {
          // Supabaseから検索
          console.log('🔍 Supabaseで検索実行:', searchQuery);
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
            console.error('Supabase検索エラー:', error);
            throw error;
          }
          
          console.log('取得したデータ:', promptsData);
          
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
              
            if (profilesError) {
              console.error('プロフィール検索エラー:', profilesError);
            } else if (profilesData && profilesData.length > 0) {
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
                
              if (userPromptsError) {
                console.error('ユーザー投稿検索エラー:', userPromptsError);
              } else {
                // データ変換処理
                const formattedResults = transformPromptsData(userPromptsData || []);
                console.log('🔍 ユーザー名検索結果:', formattedResults.length, '件');
                setResults(formattedResults);
                setFilteredResults(formattedResults);
                return;
              }
            }
          }
          
          // データ変換処理
          const formattedResults = transformPromptsData(promptsData || []);
          console.log('🔍 検索結果:', formattedResults.length, '件');
          
          if (formattedResults.length === 0) {
            // バックアップとしてモックデータから検索
            console.log('Supabaseで結果が見つからなかったため、モックデータから検索します');
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
        console.error('検索中にエラーが発生しました:', error);
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
    
    // データ変換用ヘルパー関数
    const transformPromptsData = (promptsData: any[]): PromptItem[] => {
      return promptsData.map(prompt => {
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
      });
    };
    
    // 少し遅延させて検索実行
    const timer = setTimeout(() => {
      fetchSearchResults();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchParams]); // queryではなくsearchParamsの変更を監視
  
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
  }, [results, sortOption, filterType, query, searchParams]); // searchParamsの変更も監視

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      console.log('🔍 Search.tsx内部の検索実行:', searchInput.trim());
      const searchUrl = `/search?q=${encodeURIComponent(searchInput.trim())}`;
      
      // 現在のURLと同じ検索クエリの場合、強制的にページをリロード
      if (searchParams?.get('q') === searchInput.trim()) {
        console.log('🔄 同じクエリでリロード:', searchUrl);
        window.location.href = searchUrl; // 完全なページリロード
      } else {
        console.log('🔀 新しいクエリで遷移:', searchUrl);
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
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 pb-12 mt-12">
        <div className="container px-4 py-6 sm:px-6 md:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {query ? `"${query}" の検索結果` : "すべての検索結果"}
            </h1>
            <p className="text-gray-500">
              {isLoading ? '検索中...' : `${filteredResults.length}件の結果が見つかりました`}
            </p>
          </div>
          
          {/* 並び替えとフィルタリングオプション */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* 並び替えドロップダウン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <SortAsc className="mr-2 h-4 w-4" />
                  {sortOption === 'relevance' && '関連度順'}
                  {sortOption === 'title_asc' && 'タイトル (A→Z)'}
                  {sortOption === 'title_desc' && 'タイトル (Z→A)'}
                  {sortOption === 'latest' && '新着順'}
                  {sortOption === 'oldest' && '古い順'}
                  {sortOption === 'popular' && '人気順'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>並び替え</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOption('relevance')}>
                  <SortAsc className="mr-2 h-4 w-4" />
                  関連度順
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('title_asc')}>
                  <SortAsc className="mr-2 h-4 w-4" />
                  タイトル (A→Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('title_desc')}>
                  <SortDesc className="mr-2 h-4 w-4" />
                  タイトル (Z→A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('latest')}>
                  <SortDesc className="mr-2 h-4 w-4" />
                  新着順
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('oldest')}>
                  <SortAsc className="mr-2 h-4 w-4" />
                  古い順
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('popular')}>
                  <SortDesc className="mr-2 h-4 w-4" />
                  人気順
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* フィルタードロップダウン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  フィルター
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>フィルター</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilterTypeChange('all')}>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  すべて
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterTypeChange('title')}>
                  <FileText className="mr-2 h-4 w-4" />
                  タイトル
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterTypeChange('author')}>
                  <User className="mr-2 h-4 w-4" />
                  投稿者
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterTypeChange('tag')}>
                  <Tag className="mr-2 h-4 w-4" />
                  タグ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* アクティブなフィルターバッジ */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                {activeFilters.map(filter => (
                  <Badge 
                    key={filter} 
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {getFilterDisplayName(filter)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 p-0 hover:bg-transparent"
                      onClick={() => removeFilter(filter)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prompty-primary"></div>
              <p className="mt-4 text-gray-500">検索中...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <PromptGrid prompts={filteredResults} />
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