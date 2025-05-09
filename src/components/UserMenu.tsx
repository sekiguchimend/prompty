import React, { useEffect, useState } from 'react';
import { X, LayoutDashboard, FilePen, Heart, Image, Book, Settings, LogOut, Users, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabaseClient';

interface UserProfile {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  avatarUrl?: string;
  isDesktop?: boolean;
  anchorPosition?: { top: number; right: number };
  followingUsersLink?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  onClose,
  username: defaultUsername = "匿名さん",
  avatarUrl: defaultAvatarUrl = "https://github.com/shadcn.png",
  isDesktop = false,
  anchorPosition = { top: 64, right: 16 },
  followingUsersLink
}) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // ユーザープロフィールを取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
      
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('プロフィール取得エラー:', error);
          return;
        }
        
        if (data) {
          setProfile({
            username: data.username as string | undefined,
            display_name: data.display_name as string | undefined,
            avatar_url: data.avatar_url as string | undefined
          });
        }
      } catch (error) {
        console.error('プロフィール取得中のエラー:', error);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  // 表示用の名前とアバターURLを取得
  const displayName = profile?.display_name || "匿名";
  const profileAvatarUrl = profile?.avatar_url || defaultAvatarUrl;
  
  if (!isOpen) return null;
  
  // ログアウト処理
  const handleLogout = async () => {
    try {
      // ユーザーメニューを閉じる
      onClose();
      
      
      // AuthContextのsignOut関数を呼び出し
      await signOut();
      
      
      // ログインページにリダイレクト
      setTimeout(() => {
        window.location.href = '/Login'; // 完全なページリロードのためlocation.hrefを使用
      }, 100);
    } catch (error) {
      console.error('🔴 Logout error:', error);
      alert('ログアウト中にエラーが発生しました。ページをリロードしてください。');
    }
  };
  
  // PC画面用のドロップダウンメニュー
  if (isDesktop) {
    return (
      <div className="relative">
        <div 
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-[280px]"
          style={{ 
            top: `${anchorPosition.top}px`, 
            right: `${anchorPosition.right}px` 
          }}
        >
          {/* 三角形の吹き出し部分 - メニュー内の要素として配置 */}
          <div 
            className="absolute bg-white border-t border-l border-gray-200 transform rotate-45 w-4 h-4 z-10"
            style={{ 
              top: '-8px', 
              right: '50px' 
            }}
          ></div>
          
          {/* ユーザー情報 */}
          <div className="flex items-center p-4 border-b">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                <AvatarImage src={profileAvatarUrl} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-base font-medium truncate max-w-[170px]">{displayName}</h1>
                <Link href={`/UserProfilePage`} className="text-sm text-gray-500 hover:text-gray-700">クリエイターページ</Link>
              </div>
            </div>
          </div>
          
          {/* クリエイターダッシュボードリンク */}
          <Link href="/DashboardPage" className="block px-4 py-3 border-b hover:bg-gray-50">
            <div className="flex items-center">
              <div className="flex flex-shrink-0 items-center justify-center bg-gray-50 rounded-lg w-10 h-10 mr-3">
                <LayoutDashboard className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <p className="text-sm font-medium">クリエイターダッシュボード</p>
                <p className="text-xs text-gray-500">コンテンツや分析を管理</p>
              </div>
            </div>
          </Link>
          
          {/* ポイント表示 */}
          <div className="flex p-4 items-center border-b">
            <div className="flex items-center space-x-2">
              <div className="bg-yellow-100 rounded-full w-8 h-8 flex items-center justify-center text-yellow-800 font-medium">
                P
              </div>
              <span className="text-lg font-medium">0</span>
            </div>
          </div>
          
          {/* メニューナビゲーション */}
          <nav className="py-2">
            <Link href="/MyArticles" className="flex items-center text-sm px-4 py-2 hover:bg-gray-50">
              <FilePen className="h-4 w-4 mr-3 text-gray-500" />
              自分のコンテンツ
            </Link>
            
            <Link href="/MyArticles?tab=purchasedArticles" className="flex items-center text-sm px-4 py-2 hover:bg-gray-50">
              <span className="h-4 w-4 mr-3 flex items-center justify-center text-amber-800">¥</span>
              <span className="text-amber-800">購入したコンテンツ
              </span>
            </Link>
            
            <Link href="/MyArticles?tab=likedArticles" className="flex items-center text-sm px-4 py-2 hover:bg-gray-50">
              <Heart className="h-4 w-4 mr-3 text-gray-500" />
              イイねしたコンテンツ
            </Link>
            
            <Link href="/MyArticles?tab=bookmarkedArticles" className="flex items-center text-sm px-4 py-2 hover:bg-gray-50">
              <Bookmark className="h-4 w-4 mr-3 text-gray-500" />
              ブックマークしたコンテンツ
            </Link>
            
            {followingUsersLink && (
              <Link href={followingUsersLink} className="flex items-center text-sm px-4 py-2 hover:bg-gray-50">
                <Users className="h-4 w-4 mr-3 text-gray-500" />
                フォロー中ユーザー
              </Link>
            )}
            
            <Link href="/SettingsPage" className="flex items-center text-sm px-4 py-2 hover:bg-gray-50">
              <Settings className="h-4 w-4 mr-3 text-gray-500" />
              設定
            </Link>
            
            <div className="border-t my-1"></div>
            
            <button 
              onClick={handleLogout}
              className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50 text-left"
            >
              <LogOut className="h-4 w-4 mr-3 text-gray-500" />
              ログアウト
            </button>
          </nav>
          
          <div className="p-4 border-t">
            <Link href="/Membership" className="block mb-3">
              <div className="bg-gray-50 rounded-md p-3 flex justify-center items-center">
                <span className="text-xs font-medium">月額サブスクをつくれる<br/>メンバーシップ</span>
                <div className="h-12 w-16 ml-2 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="#DFE7FF"/>
                    <path d="M18 20L24 26L30 20" stroke="#4B6BFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M24 16V34" stroke="#4B6BFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
            
            <Link href="/Premium" className="block">
              <div className="border border-gray-200 rounded-md p-3 text-center">
                <span className="text-xs font-medium">promptyプレミアムサービス</span>
              </div>
            </Link>
            
            <div className="flex justify-center mt-3 text-xs text-gray-500">
              <Link href="/Terms" className="mx-2">prompty活用術</Link>
              <span className="mx-1">/</span>
             
              <Link href="/HelpCenter" className="mx-2">ヘルプセンター</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // モバイル画面用のフルスクリーンメニュー
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
            <AvatarImage src={profileAvatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-base font-medium truncate max-w-[200px]">{displayName}</h1>
            <Link href={`/UserProfilePage`} className="text-sm text-gray-500 hover:text-gray-700">クリエイターページ</Link>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-700 p-1"
          aria-label="閉じる"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      {/* クリエイターダッシュボードリンク */}
      <Link href="/DashboardPage" className="block px-4 py-3 border-b hover:bg-gray-50">
        <div className="flex items-center">
          <div className="flex flex-shrink-0 items-center justify-center bg-gray-50 rounded-lg w-12 h-12 mr-3">
            <LayoutDashboard className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <p className="text-base font-medium">クリエイターダッシュボード</p>
            <p className="text-xs text-gray-500">記事や分析を管理</p>
          </div>
        </div>
      </Link>
      
      {/* ポイント表示 */}
      <div className="flex p-4 items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-yellow-100 rounded-full w-8 h-8 flex items-center justify-center text-yellow-800 font-medium">
            P
          </div>
          <span className="text-lg font-medium">0</span>
        </div>
      </div>
      
      {/* メニューナビゲーション */}
      <nav className="p-4 space-y-4">
        <Link href="/MyArticles" className="flex items-center text-base py-2 border-b border-gray-100 pb-4">
          <FilePen className="h-5 w-5 mr-3 text-gray-500" />
          自分の記事
        </Link>
        
        <Link href="/MyArticles?tab=purchasedArticles" className="flex items-center text-base py-2 border-b border-gray-100 pb-4">
          <span className="h-5 w-5 mr-3 flex items-center justify-center text-amber-800">¥</span>
          <span className="text-amber-800">購入した記事</span>
        </Link>
        
        <Link href="/MyArticles?tab=likedArticles" className="flex items-center text-base py-2 border-b border-gray-100 pb-4">
          <Heart className="h-5 w-5 mr-3 text-gray-500" />
          イイねしたコンテンツ
        </Link>
        
        <Link href="/MyArticles?tab=bookmarkedArticles" className="flex items-center text-base py-2 border-b border-gray-100 pb-4">
          <Bookmark className="h-5 w-5 mr-3 text-gray-500" />
          ブックマークしたコンテンツ
        </Link>
        
        {followingUsersLink && (
          <Link href={followingUsersLink} className="flex items-center text-base py-2 border-b border-gray-100 pb-4">
            <Users className="h-5 w-5 mr-3 text-gray-500" />
            フォロー中ユーザー
          </Link>
        )}
        
        <Link href="/SettingsPage" className="flex items-center text-base py-2 border-b border-gray-100 pb-4">
          <Settings className="h-5 w-5 mr-3 text-gray-500" />
          設定
        </Link>
        
        <button 
          onClick={handleLogout}
          className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4"
        >
          <LogOut className="h-5 w-5 mr-3 text-gray-500" />
          ログアウト
        </button>
      </nav>
      
      <div className="border-t border-gray-100 bg-white mt-4">
        <Link href="/Membership" className="block p-4">
          <div className="bg-gray-50 rounded-md p-3 flex justify-center items-center">
            <span className="text-sm font-medium">月額サブスクをつくれる<br/>メンバーシップ</span>
            <div className="h-16 w-20 ml-2 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="#DFE7FF"/>
                <path d="M18 20L24 26L30 20" stroke="#4B6BFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 16V34" stroke="#4B6BFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </Link>
        
        <Link href="/Premium" className="block p-4 pt-0">
          <div className="bg-white border border-gray-200 rounded-md p-3 text-center">
            <span className="text-sm font-medium">promptyプレミアムサービス</span>
          </div>
        </Link>
        
        <div className="flex justify-center pb-4 text-sm text-gray-500">
          <Link href="/Terms" className="mx-2">prompty活用術</Link>
          <span className="mx-1">/</span>
          <Link href="/Help" className="mx-2">ヘルプセンター</Link>
        </div>
      </div>
    </div>
  );
};

export default UserMenu; 