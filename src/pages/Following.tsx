import React, { useState, useEffect } from 'react';
import { ChevronRight, Heart, MessageSquare, MoreVertical, Bookmark } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { PostItem, getFollowingPosts, getTodayForYouPosts } from '../data/posts';
import ReportDialog from '../components/ReportDialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { useToast } from '../components/ui/use-toast';
import Link from 'next/link';

const Following: React.FC = () => {
  // データ取得
  const [followingPosts, setFollowingPosts] = useState<PostItem[]>(getFollowingPosts());
  const [todayForYouPosts, setTodayForYouPosts] = useState<PostItem[]>(getTodayForYouPosts());
  
  // 報告ダイアログの状態
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  
  const { toast } = useToast();
  
  // いいねのトグル処理
  const toggleLike = (postId: string, postList: PostItem[]) => {
    return postList.map(post => {
      if (post.id === postId) {
        // いいねの状態をトグル
        const isLiked = post.isLiked || false;
        const newLikeCount = isLiked ? post.likeCount - 1 : post.likeCount + 1;
        
        return {
          ...post,
          likeCount: newLikeCount,
          isLiked: !isLiked
        };
      }
      return post;
    });
  };
  
  // フォロー中の投稿のいいねをトグル
  const handleFollowingLike = (postId: string) => {
    setFollowingPosts(toggleLike(postId, followingPosts));
  };
  
  // 「今日のあなたに」の投稿のいいねをトグル
  const handleTodayForYouLike = (postId: string) => {
    setTodayForYouPosts(toggleLike(postId, todayForYouPosts));
  };
  
  // 報告ダイアログを開く
  const openReportDialog = (postId: string) => {
    setSelectedPostId(postId);
    setReportDialogOpen(true);
  };
  
  // 投稿を非表示にする
  const hidePost = (postId: string) => {
    // フォロー中の投稿を非表示
    setFollowingPosts(prev => prev.filter(post => post.id !== postId));
    // 今日のあなたにの投稿を非表示
    setTodayForYouPosts(prev => prev.filter(post => post.id !== postId));
    
    toast({
      title: "投稿を非表示にしました",
      description: "このコンテンツは今後表示されません",
    });
  };
  
  return (
    <>
      <Header />
      
      <main className="flex-1 pb-12 mt-20 md:mt-16">
        <div className="container mx-auto px-4">
          {/* フォロー中のコンテンツ */}
          <div className="mt-4">
            <div className="pb-3 px-4 flex items-center">
              <h2 className="text-xl font-bold">フォロー中</h2>
              <span className="text-gray-500 ml-1">
                <ChevronRight className="h-5 w-5" />
              </span>
            </div>
            
            {/* モバイル表示の記事リスト */}
            <div className="md:hidden divide-y divide-gray-100">
              {followingPosts.map((post) => (
                <article key={post.id} className="px-4 py-5">
                  <div className="flex">
                    <div className="flex-1 pr-4 overflow-hidden">
                      <h3 className="font-medium text-[15px] mb-2.5 leading-tight line-clamp-2">{post.title}</h3>
                      <div className="flex items-center mt-2.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
                          <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-gray-500">{post.user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{post.postedAt}</span>
                      </div>
                      <div className="flex items-center mt-2.5">
                        <button 
                          className={`flex items-center mr-4 ${post.isLiked ? 'text-red-500' : 'text-gray-400'}`}
                          onClick={() => handleFollowingLike(post.id)}
                        >
                          <Heart 
                            className={`h-[14px] w-[14px] mr-1.5 ${post.isLiked ? 'fill-red-500' : ''}`} 
                          />
                          <span className="text-xs">{post.likeCount}</span>
                        </button>
                        <button className="flex items-center text-gray-400">
                          <MessageSquare className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-[104px] h-[58px] flex-shrink-0 bg-gray-100 rounded-md overflow-hidden shadow-sm">
                        <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* 三点メニュー */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center p-1 ml-1 rounded-full text-gray-400 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReportDialog(post.id)}>
                            報告する
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => hidePost(post.id)}>
                            非表示にする
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* PC表示のグリッドレイアウト */}
            <div className="hidden md:grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4">
              {followingPosts.map((post) => (
                <div key={post.id} className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm">
                  <Link href={`/prompts/${post.id}`} className="block">
                    <div className="relative pb-[56.25%]">
                      <img 
                        src={post.thumbnailUrl} 
                        alt={post.title} 
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex flex-col p-3">
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/prompts/${post.id}`} className="line-clamp-2 font-medium hover:text-prompty-primary flex-1 mr-2">
                        {post.title}
                      </Link>
                      
                      {/* 三点メニュー */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center p-1 rounded-full text-gray-400 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReportDialog(post.id)}>
                            報告する
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => hidePost(post.id)}>
                            非表示にする
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex items-center gap-2">
                        <Link href={`/users/${post.user.name}`} className="block h-6 w-6 overflow-hidden rounded-full">
                          <img 
                            src={post.user.avatarUrl} 
                            alt={post.user.name} 
                            className="h-full w-full object-cover"
                          />
                        </Link>
                        <Link href={`/users/${post.user.name}`} className="text-xs text-gray-600 hover:underline">
                          {post.user.name}
                        </Link>
                        <span className="text-xs text-gray-500">{post.postedAt}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center text-gray-500 mt-4">
                          <button 
                            className={`like-button flex items-center ${post.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                            onClick={() => handleFollowingLike(post.id)}
                          >
                            <Heart className={`mr-1 h-4 w-4 ${post.isLiked ? 'fill-red-500' : ''}`} />
                          </button>
                          <span className="text-xs">{post.likeCount}</span>
                        </div>
                        <div className="flex items-center text-gray-500 mt-4 ml-2">
                          <button className="like-button flex items-center">
                            <Bookmark className="mr-1 h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 今日のあなたに */}
            <div className="pt-6 pb-3 px-4 flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-xl font-bold">今日のあなたに</h2>
                <span className="text-gray-500 ml-1">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </div>
            </div>
            
            {/* 今日のあなたに モバイル表示 */}
            <div className="md:hidden divide-y divide-gray-100">
              {todayForYouPosts.map((post) => (
                <article key={post.id} className="px-4 py-5">
                  <div className="flex">
                    <div className="flex-1 pr-4 overflow-hidden">
                      <h3 className="font-medium text-[15px] mb-2.5 leading-tight line-clamp-2">{post.title}</h3>
                      <div className="flex items-center mt-2.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
                          <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-gray-500">{post.user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{post.postedAt}</span>
                      </div>
                      <div className="flex items-center mt-2.5">
                        <button 
                          className={`flex items-center mr-4 ${post.isLiked ? 'text-red-500' : 'text-gray-400'}`}
                          onClick={() => handleTodayForYouLike(post.id)}
                        >
                          <Heart 
                            className={`h-[14px] w-[14px] mr-1.5 ${post.isLiked ? 'fill-red-500' : ''}`} 
                          />
                          <span className="text-xs">{post.likeCount}</span>
                        </button>
                        <button className="flex items-center text-gray-400">
                          <MessageSquare className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-[104px] h-[58px] flex-shrink-0 bg-gray-100 rounded-md overflow-hidden shadow-sm">
                        <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* 三点メニュー */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center p-1 ml-1 rounded-full text-gray-400 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReportDialog(post.id)}>
                            報告する
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => hidePost(post.id)}>
                            非表示にする
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* 今日のあなたに PC表示 */}
            <div className="hidden md:grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4">
              {todayForYouPosts.map((post) => (
                <div key={post.id} className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm">
                  <Link href={`/prompts/${post.id}`} className="block">
                    <div className="relative pb-[56.25%]">
                      <img 
                        src={post.thumbnailUrl} 
                        alt={post.title} 
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex flex-col p-3">
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/prompts/${post.id}`} className="line-clamp-2 font-medium hover:text-prompty-primary flex-1 mr-2">
                        {post.title}
                      </Link>
                      
                      {/* 三点メニュー */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center p-1 rounded-full text-gray-400 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReportDialog(post.id)}>
                            報告する
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => hidePost(post.id)}>
                            非表示にする
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex items-center gap-2">
                        <Link href={`/users/${post.user.name}`} className="block h-6 w-6 overflow-hidden rounded-full">
                          <img 
                            src={post.user.avatarUrl} 
                            alt={post.user.name} 
                            className="h-full w-full object-cover"
                          />
                        </Link>
                        <Link href={`/users/${post.user.name}`} className="text-xs text-gray-600 hover:underline">
                          {post.user.name}
                        </Link>
                        <span className="text-xs text-gray-500">{post.postedAt}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center text-gray-500 mt-4">
                          <button 
                            className={`like-button flex items-center ${post.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                            onClick={() => handleTodayForYouLike(post.id)}
                          >
                            <Heart className={`mr-1 h-4 w-4 ${post.isLiked ? 'fill-red-500' : ''}`} />
                          </button>
                          <span className="text-xs">{post.likeCount}</span>
                        </div>
                        <div className="flex items-center text-gray-500 mt-4 ml-2">
                          <button className="like-button flex items-center">
                            <Bookmark className="mr-1 h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* 報告ダイアログ */}
      <ReportDialog 
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        postId={selectedPostId}
      />
    </>
  );
};

export default Following;