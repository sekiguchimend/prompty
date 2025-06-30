import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { X, LayoutDashboard, FilePen, Heart, Image, Book, Settings, LogOut, Users, Bookmark, Code, Shield } from 'lucide-react';
import { Avatar } from './shared/Avatar';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabaseClient';
import { getDisplayName } from '../types/profile';
import { checkAdminStatus } from '../lib/admin-auth';

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

const UserMenu: React.FC<UserMenuProps> = React.memo(({
  isOpen,
  onClose,
  isDesktop = false,
  anchorPosition = { top: 64, right: 16 },
  followingUsersLink
  
}) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // ページ遷移開始時にメニューを閉じる
  useEffect(() => {
    const handleRouteChangeStart = () => {
      onClose();
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router.events, onClose]);

  // 管理者権限をチェック
  const checkUserAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    try {
      const adminStatus = await checkAdminStatus(user.id);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('管理者権限チェックエラー:', error);
      setIsAdmin(false);
    }
  }, [user]);
  
  useEffect(() => {
    checkUserAdminStatus();
  }, [checkUserAdminStatus]);
  
  // 表示用の名前を取得 - useMemoで最適化
  const displayName = useMemo(() => getDisplayName(user?.display_name, user?.username), [user?.display_name, user?.username]);
  
  // ログアウト処理 - useCallbackで最適化
  const handleLogout = useCallback(async () => {
    try {
      // ユーザーメニューを閉じる
      onClose();
      
      // AuthContextのsignOut関数を呼び出し
      await signOut();
      
      // ログインページにリダイレクト
      setTimeout(() => {
        router.push('/login');
      }, 100);
    } catch (error) {
      console.error('🔴 Logout error:', error);
      alert('ログアウト中にエラーが発生しました。ページをリロードしてください。');
    }
  }, [onClose, signOut, router]);
  
  // onCloseをuseCallbackでラップ
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  if (!isOpen) return null;
  
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
          <div className="p-4 border-b">
            <div className="flex items-center">
              <Avatar 
                src={user?.avatar_url}
                displayName={displayName}
                size="md"
                className="mr-3 flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-base font-medium truncate max-w-[170px]">{displayName}</h1>
                <Link 
                  href="/profile"
                  className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer text-left"
                >
                  クリエイターページ
                </Link>
              </div>
            </div>
          </div>
          
          {/* クリエイターダッシュボードリンク */}
          <Link href="/dashboard" className="block w-full px-4 py-3 border-b hover:bg-gray-50 text-left">
            <div className="flex items-center">
              <div className="flex flex-shrink-0 items-center justify-center bg-gray-50 rounded-lg w-12 h-12 mr-3">
                <LayoutDashboard className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <p className="text-base font-medium">ダッシュボード</p>
                <p className="text-xs text-gray-500">記事や分析を管理</p>
              </div>
            </div>
          </Link>
          
          {/* 管理者ダッシュボードリンク - 管理者のみ表示 */}
          {isAdmin && (
            <Link href="/admin" className="block w-full px-4 py-3 border-b hover:bg-gray-50 text-left">
              <div className="flex items-center">
                <div className="flex flex-shrink-0 items-center justify-center bg-red-50 rounded-lg w-12 h-12 mr-3">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-base font-medium text-red-600">管理者ダッシュボード</p>
                  <p className="text-xs text-red-500">システム管理</p>
                </div>
              </div>
            </Link>
          )}
          
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
            <Link href="/my-articles" className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50">
              <FilePen className="h-4 w-4 mr-3 text-gray-500" />
              自分のコンテンツ
            </Link>
            
            <Link href="/code-generator" className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50">
              <Code className="h-4 w-4 mr-3 text-purple-600" />
              <span className="text-purple-600">AIコード生成</span>
            </Link>
            
            <Link href="/my-articles?tab=purchasedArticles" className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50">
              <span className="h-4 w-4 mr-3 flex items-center justify-center text-amber-800">¥</span>
              <span className="text-amber-800">購入したコンテンツ</span>
            </Link>
            
            <Link href="/my-articles?tab=likedArticles" className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50">
              <Heart className="h-4 w-4 mr-3 text-gray-500" />
              イイねしたコンテンツ
            </Link>
            
            <Link href="/my-articles?tab=bookmarkedArticles" className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50">
              <Bookmark className="h-4 w-4 mr-3 text-gray-500" />
              ブックマークしたコンテンツ
            </Link>
            
            {followingUsersLink && (
              <Link href={followingUsersLink} className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50">
                <Users className="h-4 w-4 mr-3 text-gray-500" />
                フォロー中ユーザー
              </Link>
            )}
            
            <Link href="/settings" className="flex w-full items-center text-sm px-4 py-2 hover:bg-gray-50">
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
            <Link href="/premium" className="block mb-3">
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
            
            <Link href="/premium" className="block">
              <div className="border border-gray-200 rounded-md p-3 text-center">
                <span className="text-xs font-medium">promptyプレミアムサービス</span>
              </div>
            </Link>
            
            <div className="flex justify-center mt-3 text-xs text-gray-500">
              <Link href="/terms" className="mx-2">prompty活用術</Link>
              <span className="mx-1">/</span>
              <Link href="/help-center">ヘルプセンター</Link>
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
          <Avatar 
            src={user?.avatar_url}
            displayName={displayName}
            size="md"
            className="mr-3 flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-base font-medium truncate max-w-[200px]">{displayName}</h1>
            <Link 
              href="/profile"
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer text-left"
            >
              クリエイターページ
            </Link>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-700 p-1"
          aria-label="閉じる"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      {/* クリエイターダッシュボードリンク */}
      <Link href="/dashboard" className="block w-full px-4 py-3 border-b hover:bg-gray-50 text-left">
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
      
      {/* 管理者ダッシュボードリンク - 管理者のみ表示 */}
      {isAdmin && (
        <Link href="/admin" className="block w-full px-4 py-3 border-b hover:bg-gray-50 text-left">
          <div className="flex items-center">
            <div className="flex flex-shrink-0 items-center justify-center bg-red-50 rounded-lg w-12 h-12 mr-3">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-base font-medium text-red-600">管理者ダッシュボード</p>
              <p className="text-xs text-red-500">システム管理</p>
            </div>
          </div>
        </Link>
      )}
      
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
        <Link href="/my-articles" className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4">
          <FilePen className="h-5 w-5 mr-3 text-gray-500" />
          自分の記事
        </Link>
        
        <Link href="/code-generator" className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4">
          <Code className="h-5 w-5 mr-3 text-purple-600" />
          <span className="text-purple-600">AIコード生成</span>
        </Link>
        
        <Link href="/my-articles?tab=purchasedArticles" className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4">
          <span className="h-5 w-5 mr-3 flex items-center justify-center text-amber-800">¥</span>
          <span className="text-amber-800">購入した記事</span>
        </Link>
        
        <Link href="/my-articles?tab=likedArticles" className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4">
          <Heart className="h-5 w-5 mr-3 text-gray-500" />
          イイねしたコンテンツ
        </Link>
        
        <Link href="/my-articles?tab=bookmarkedArticles" className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4">
          <Bookmark className="h-5 w-5 mr-3 text-gray-500" />
          ブックマークしたコンテンツ
        </Link>
        
        {followingUsersLink && (
          <Link href={followingUsersLink} className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4">
            <Users className="h-5 w-5 mr-3 text-gray-500" />
            フォロー中ユーザー
          </Link>
        )}
        
        <Link href="/settings" className="flex w-full items-center text-base py-2 border-b border-gray-100 pb-4">
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
        <Link href="/premium" className="block p-4">
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
        
        <Link href="/premium" className="block p-4 pt-0">
          <div className="bg-white border border-gray-200 rounded-md p-3 text-center">
            <span className="text-sm font-medium">promptyプレミアムサービス</span>
          </div>
        </Link>
        
        <div className="flex justify-center mt-3 text-xs text-gray-500">
          <Link href="/terms">prompty活用術</Link>
          <span className="mx-1">/</span>
          <Link href="/help-center">ヘルプセンター</Link>
        </div>
      </div>
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu; 