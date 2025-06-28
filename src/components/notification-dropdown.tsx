import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import HeaderAnnouncements from './header-announcements';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Make fetchUnreadCount a memoized callback so it can be called from other effects
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      // For anonymous users, we don't track read status
      // Just fetch the last 7 days worth of announcements
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('announcements')
        .select('id')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .gte('start_date', oneWeekAgo.toISOString());
      
      if (!error && data) {
        setUnreadCount(data.length);
      }
      return;
    }
    
    // クエリを実行してお知らせと既読情報を一度に取得
    const { data: activeAnnouncements, error: announcementError } = await supabase
      .from('announcements')
      .select('id, created_at')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);
      
    if (announcementError || !activeAnnouncements) {
      console.error('Failed to fetch announcements:', announcementError);
      return;
    }
    
    if (activeAnnouncements.length === 0) {
      setUnreadCount(0);
      return;
    }
    
    // 既読情報を取得
    const { data: reads, error: readsError } = await supabase
      .from('announcement_reads')
      .select('announcement_id, created_at')
      .eq('user_id', user.id)
      .in('announcement_id', activeAnnouncements.map(a => a.id));
      
    if (readsError) {
      console.error('Failed to fetch read status:', readsError);
      return;
    }
    
    // 既読情報をMapに変換して検索を効率化
    const readMap = new Map();
    reads?.forEach(read => {
      // anyを使用して型エラーを回避
      const typedRead = read as any;
      readMap.set(typedRead.announcement_id, new Date(String(typedRead.created_at)));
    });
    
    // 各お知らせが未読かチェック
    // 「未読」の定義: 1. 既読テーブルに記録がない、または 2. お知らせの作成日時が既読日時より新しい
    const unreadItems = activeAnnouncements.filter(announcement => {
      // anyを使用して型エラーを回避
      const typedAnnouncement = announcement as any;
      const readDate = readMap.get(typedAnnouncement.id);
      const announcementDate = new Date(String(typedAnnouncement.created_at));
      return !readDate || announcementDate > readDate;
    });
    
    setUnreadCount(unreadItems.length);
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up a subscription for real-time updates to announcements
    const subscription = supabase
      .channel(`notifications-announcements-${Math.random().toString(36).substr(2, 9)}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements' 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();
      
    // Also listen for changes to announcement_reads table
    const readsSubscription = supabase
      .channel(`notifications-reads-${Math.random().toString(36).substr(2, 9)}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcement_reads' 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
      readsSubscription.unsubscribe();
    };
  }, [fetchUnreadCount]);

  // Update unread count when dropdown is opened/closed
  useEffect(() => {
    if (isOpen) {
      fetchUnreadCount();
    }
  }, [isOpen, fetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // 楽観的更新を削除 - 実際に通知が読まれた時のみ未読数を更新
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button 
        onClick={toggleDropdown}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full"
        aria-label="通知"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center md:static md:inset-auto md:absolute md:right-0 md:mt-2 md:z-100 bg-black bg-opacity-50 md:bg-transparent"
          onClick={(e) => {
            // 背景をクリックした場合のみ閉じる
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div 
            className="w-screen max-w-[90vw] md:max-w-sm sm:max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <HeaderAnnouncements 
              onClose={() => setIsOpen(false)} 
              onUnreadCountChange={(count) => {
                setUnreadCount(count);
                // 状態の確実な同期のため、少し遅延させて再度取得
                setTimeout(() => {
                  fetchUnreadCount();
                }, 100);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;