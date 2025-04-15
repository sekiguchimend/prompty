import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import AvatarGroup from '../../components/AvatarGroup';
import { Heart, Share2, MessageSquare, MoreHorizontal, FileText, PenTool, Flag, X, Send } from 'lucide-react';
import PurchaseDialog from './PurchaseDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { toast } from '../../components/ui/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { Textarea } from '../../components/ui/textarea';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

interface PurchaseSectionProps {
  wordCount: number;
  price: number;
  tags: string[];
  reviewers: string[];
  reviewCount: number;
  likes: number;
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
    website: string;
  };
  socialLinks: {
    icon: string;
    url: string;
  }[];
}

const PurchaseSection: React.FC<PurchaseSectionProps> = ({ 
  wordCount, 
  price, 
  tags, 
  reviewers, 
  reviewCount,
  likes: initialLikes,
  author,
  socialLinks
}) => {
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCommentSectionVisible, setIsCommentSectionVisible] = useState(false);
  const [comments, setComments] = useState<Array<{id: number, author: string, avatarUrl: string, text: string, timestamp: string}>>([
    {
      id: 1,
      author: "山田太郎",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
      text: "このプロンプトは素晴らしいですね！使ってみます。",
      timestamp: "1日前"
    },
    {
      id: 2,
      author: "佐藤花子",
      avatarUrl: "https://i.pravatar.cc/150?img=2",
      text: "詳細な説明があって参考になりました。ありがとうございます。",
      timestamp: "5時間前"
    }
  ]);
  const [newComment, setNewComment] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const handleFollowClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsFollowing(!isFollowing);
      setIsAnimating(false);
      
      if (!isFollowing) {
        toast({
          title: `${author.name}さんをフォローしました`,
          description: "新しい投稿があればお知らせします",
        });
      } else {
        toast({
          title: `${author.name}さんのフォローを解除しました`,
          variant: "destructive"
        });
      }
    }, 300);
  };

  const handleLikeClick = () => {
    if (liked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
      toast({
        title: "いいねしました",
        description: "このプロンプトにいいねしました",
      });
    }
    setLiked(!liked);
  };

  const handleShareClick = () => {
    setIsShareDialogOpen(true);
  };

  const handleCommentClick = () => {
    setIsCommentSectionVisible(!isCommentSectionVisible);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        author: "あなた",
        avatarUrl: "https://github.com/shadcn.png",
        text: newComment,
        timestamp: "たった今"
      };
      setComments([...comments, newCommentObj]);
      setNewComment("");
      toast({
        title: "コメントを投稿しました",
      });
    }
  };

  const handleReport = () => {
    setIsReportDialogOpen(false);
    if (reportReason.trim()) {
      toast({
        title: "報告を受け付けました",
        description: "ご報告ありがとうございます。内容を確認いたします。",
      });
      setReportReason("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "コピーしました",
        description: "クリップボードにコピーしました",
      });
    }).catch(err => {
      console.error('クリップボードへのコピーに失敗しました:', err);
    });
  };

  return (
    <div className="mt-16 border-t border-gray-200 pt-10">
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="px-4 py-1 rounded-sm bg-gray-50 hover:bg-gray-100 cursor-pointer"
          >
            #{tag}
          </Badge>
        ))}
      </div>
      
      {/* Social interaction buttons */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button 
            className={`flex items-center ${liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'} focus:outline-none transition-colors`}
            onClick={handleLikeClick}
          >
            <Heart className={`h-6 w-6 mr-1 ${liked ? 'fill-current text-red-500' : 'text-gray-500'} transition-colors`} />
            <span>{likes}</span>
          </button>
          <button 
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={handleShareClick}
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button 
            className={`flex items-center ${isCommentSectionVisible ? 'text-blue-500 hover:text-blue-600' : 'text-gray-500 hover:text-gray-700'} focus:outline-none transition-colors`}
            onClick={handleCommentClick}
          >
            <MessageSquare className={`h-5 w-5 ${isCommentSectionVisible ? 'text-blue-500' : ''}`} />
            <span className="ml-1 text-sm">{comments.length}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                <Flag className="h-4 w-4 mr-2" />
                報告する
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Author profile - Smaller version */}
      <div className="border-t border-gray-200 pt-6 mb-8">
        <div className="flex flex-col">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={author.avatarUrl} 
                alt={author.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium">{author.name}</h4>
              <p className="text-xs text-gray-600 mt-1">
                <span>📚新刊『発信をお金にかえる勇気』予約開始！！</span>
              </p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                著者、コンサルタント/『発信する勇気』（きずな出版）/ コンテンツビジネススクール主宰 / 公式メルマガ→
                <a href={author.website} className="text-gray-700 hover:underline">{author.website}</a>
              </p>
              
              <div className="flex space-x-2 mt-2">
                {socialLinks.map((link, index) => (
                  <a key={index} href={link.url} className="text-gray-500 hover:text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-gray-200">
                      <span className="text-xs">{link.icon.charAt(0).toUpperCase()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <Button 
            className={`${
              isFollowing 
                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100' 
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } rounded-sm text-xs py-1 px-5 h-auto transition-all duration-200 ${
              isAnimating ? 'scale-95' : ''
            } w-auto mx-auto block`}
            onClick={handleFollowClick}
          >
            {isFollowing ? 'フォロー中' : 'フォロー'}
          </Button>
        </div>
      </div>
      
      {/* コメントセクション */}
      {isCommentSectionVisible && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4">コメント ({comments.length})</h3>
          
          {/* コメント一覧 */}
          <div className="space-y-6 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={comment.avatarUrl} alt={comment.author} />
                  <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1 text-gray-700">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* コメント入力フォーム */}
          <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://github.com/shadcn.png" alt="あなた" />
                <AvatarFallback>あ</AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea 
                  placeholder="コメントを入力..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none min-h-[80px] p-3 pr-10"
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim()} 
                  className="absolute bottom-3 right-3 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <PurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        prompt={{
          title: author.name,
          author,
          price
        }}
      />

      {/* 共有ダイアログ */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>共有</DialogTitle>
            <DialogDescription>
              このプロンプトを共有する方法を選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => window.open("https://twitter.com/intent/tweet?text=すごいプロンプトを見つけました！&url=" + window.location.href, "_blank")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  X（Twitter）
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => window.open("https://www.facebook.com/sharer/sharer.php?u=" + window.location.href, "_blank")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => window.open("https://line.me/R/msg/text/?" + window.location.href, "_blank")}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="#06C755">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.844 2.572-5.992zm-18.988-2.595c.129 0 .234.105.234.234v4.153h2.287c.129 0 .233.104.233.233v.842a.233.233 0 01-.233.234H4.781a.233.233 0 01-.234-.234V7.943c0-.129.105-.234.234-.234h.465zm14.701 0c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-2.287v.922h2.287c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-2.287v.922h2.287c.129 0 .233.105.233.234v.842a.232.232 0 01-.233.234h-3.363a.233.233 0 01-.234-.234V7.943c0-.129.105-.234.234-.234h3.363zm-10.12.002c.128 0 .233.104.233.233v4.153c0 .129-.105.234-.233.234h-.842a.233.233 0 01-.234-.234V7.944c0-.129.105-.233.234-.233h.842zm2.894 0a.233.233 0 01.233.233v4.153a.232.232 0 01-.233.234h-.842a.232.232 0 01-.233-.234V7.944c0-.129.104-.233.233-.233h.842z" />
                  </svg>
                  LINE
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 justify-center"
                  onClick={() => copyToClipboard(window.location.href)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  URLをコピー
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                閉じる
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 報告ダイアログ */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コンテンツを報告</DialogTitle>
            <DialogDescription>
              このコンテンツを報告する理由を教えてください。すべての報告は匿名で処理されます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea 
              placeholder="報告の詳細を入力してください..." 
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsReportDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="button" onClick={handleReport} disabled={!reportReason.trim()}>
              報告する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseSection;
