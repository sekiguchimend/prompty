import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import HeaderAnnouncements from './HeaderAnnouncements';
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
      readMap.set(read.announcement_id, new Date(read.created_at));
    });
    
    // 各お知らせが未読かチェック
    // 「未読」の定義: 1. 既読テーブルに記録がない、または 2. お知らせの作成日時が既読日時より新しい
    const unreadItems = activeAnnouncements.filter(announcement => {
      const readDate = readMap.get(announcement.id);
      const announcementDate = new Date(announcement.created_at);
      return !readDate || announcementDate > readDate;
    });
    
    setUnreadCount(unreadItems.length);
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up a subscription for real-time updates to announcements
    const subscription = supabase
      .channel('public:announcements')
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
      .channel('public:announcement_reads')
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
      console.log('Dropdown opened - refreshing unread count');
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
    
    // ドロップダウンを閉じるときも最新の状態に更新
    if (!newState) {
      setTimeout(() => {
        console.log('Dropdown closed - refreshing count after timeout');
        fetchUnreadCount();
      }, 500); // 500ms後に再取得（UIアニメーション完了後）
    }
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
        <div className="absolute right-0 mt-2 z-50 w-screen max-w-sm sm:max-w-md">
          <HeaderAnnouncements onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;