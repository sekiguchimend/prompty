"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../lib/auth-context';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  content: string;
  icon: string | null;
  icon_color: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  is_read?: boolean;
}

interface Notification {
  id: number;
  type: 'achievement' | 'alert' | 'gift' | 'like';
  content: string;
  time: string;
  is_read: boolean;
}

type TabType = '通知' | 'お知らせ';

const HeaderAnnouncements: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('お知らせ');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // fetchAnnouncementsをuseCallbackでラップして、コンポーネント内のどこからでも参照可能にする
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch active announcements
      const { data: announcementData, error: announcementError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('start_date', { ascending: false });

      if (announcementError) throw announcementError;
      
      // If user is logged in, check which announcements they've read
      let readMap = new Map(); // announcement_id => 読んだ日時
      
      if (user) {
        // より確実に既読データを取得するためのクエリを実行
        const { data: readData, error: readError } = await supabase
          .from('announcement_reads')
          .select('*')
          .eq('user_id', user.id);
          
        if (readError) {
          console.error('既読データの取得に失敗しました:', readError);
        } else if (readData && readData.length > 0) {
          console.log('取得した既読データ:', readData);
          // 既読情報をMapに変換して検索を効率化
          readData.forEach(item => {
            readMap.set(item.announcement_id, new Date(item.created_at));
          });
        }
      }
      
      // Mark announcements as read/unread
      const processedAnnouncements = announcementData.map(announcement => {
        // お知らせの作成日時
        const announcementDate = new Date(announcement.created_at);
        // 既読日時
        const readDate = readMap.get(announcement.id);
        
        // 既読の定義: 既読テーブルに記録がある
        // タイムスタンプの比較ロジックを一時的に無効化し、問題を特定
        const isRead = readMap.has(announcement.id);
        
        return {
          ...announcement,
          is_read: isRead
        };
      });
      
      // Count unread announcements
      const unreadCount = processedAnnouncements.filter(ann => !ann.is_read).length;
      
      setUnreadAnnouncements(unreadCount);
      setAnnouncements(processedAnnouncements);
      
      // TODO: In the future, fetch real notifications
      // For now, we'll use dummy data for notifications
      const dummyNotifications: Notification[] = [];
      setNotifications(dummyNotifications);
      setUnreadNotifications(0);
    } catch (error) {
      console.error('お知らせの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);  // user依存関係を追加

  // useEffectで初回マウント時にデータを取得
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && onClose) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Mark all as read when tab is opened
    if (tab === 'お知らせ' && unreadAnnouncements > 0) {
      markAllAnnouncementsRead();
    } else if (tab === '通知' && unreadNotifications > 0) {
      setUnreadNotifications(0);
      // TODO: Mark notifications as read in the database
    }
  };

  const markAllAnnouncementsRead = async () => {
    if (!user) return; // Anonymous users don't track read status
    
    try {
      const unreadAnnouncements = announcements.filter(a => !a.is_read);
      
      if (unreadAnnouncements.length === 0) return;
      
      console.log('Marking all announcements as read:', unreadAnnouncements.length, '件');
      
      // Mark announcements as read in the UI immediately
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(a => ({ ...a, is_read: true }))
      );
      setUnreadAnnouncements(0);
      
      // 一旦既存の既読レコードを取得
      const { data: existingReads, error: checkError } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id)
        .in('announcement_id', unreadAnnouncements.map(a => a.id));
        
      if (checkError) {
        console.error('既読チェックに失敗しました:', checkError);
        return;
      }
      
      // 既存の既読レコードのIDをセットに変換
      const existingReadIds = new Set(existingReads?.map(r => r.announcement_id) || []);
      
      // 既に既読のものは除外して新規に必要なもののみ挿入
      const newReads = unreadAnnouncements
        .filter(a => !existingReadIds.has(a.id))
        .map(a => ({
          user_id: user.id,
          announcement_id: a.id,
          created_at: new Date().toISOString()
        }));
      
      if (newReads.length > 0) {
        // 新規の既読レコードのみ挿入
        const { data, error } = await supabase
          .from('announcement_reads')
          .insert(newReads)
          .select();
        
        if (error) {
          console.error('お知らせの既読設定に失敗しました:', error);
        } else {
          console.log('全お知らせ既読設定成功:', data);
          
          // 成功後に再度データを取得して表示を更新（念のため）
          fetchAnnouncements();
        }
      } else {
        console.log('新たに既読設定が必要なお知らせはありません');
        // 既に全て既読である場合でもデータを更新（UI表示の一貫性のため）
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('お知らせの既読処理に失敗しました:', error);
    }
  };

  const markAnnouncementAsRead = async (announcementId: string) => {
    if (!user) return; // Anonymous users don't track read status
    
    try {
      // Check if the announcement is already read
      const announcement = announcements.find(a => a.id === announcementId);
      if (!announcement) return;
      
      console.log('Marking announcement as read:', announcementId);
      console.log('Current is_read status:', announcement.is_read);
      
      // すでに既読の場合でも処理を継続（データの一貫性を確保するため）
      // debugのためにあえて既読でも処理を実行
      
      // Mark as read in the UI immediately
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(a => 
          a.id === announcementId ? { ...a, is_read: true } : a
        )
      );
      
      // Update unread count if it was unread
      if (!announcement.is_read) {
        setUnreadAnnouncements(prev => Math.max(0, prev - 1));
      }
      
      // 既存の既読レコードを確認
      const { data: existingRead, error: checkError } = await supabase
        .from('announcement_reads')
        .select('*')
        .eq('user_id', user.id)
        .eq('announcement_id', announcementId)
        .maybeSingle();
        
      if (checkError) {
        console.error('既読チェックに失敗しました:', checkError);
        return;
      }
      
      let result;
      
      // 既存レコードがある場合は削除してから再挿入
      if (existingRead) {
        console.log('既存の既読レコードを更新します:', existingRead);
        
        // 既存レコード削除
        const { error: deleteError } = await supabase
          .from('announcement_reads')
          .delete()
          .eq('user_id', user.id)
          .eq('announcement_id', announcementId);
          
        if (deleteError) {
          console.error('既存の既読レコード削除に失敗しました:', deleteError);
          return;
        }
      }
      
      // 新しい既読レコードを挿入
      const { data, error } = await supabase
        .from('announcement_reads')
        .insert({
          user_id: user.id,
          announcement_id: announcementId,
          created_at: new Date().toISOString() // 最終既読時間
        })
        .select();
        
      result = { data, error };
      
      if (error) {
        console.error('お知らせの既読設定に失敗しました:', error);
      } else {
        console.log('既読設定成功:', data);
        
        // 成功後に再度データを取得して表示を更新（念のため）
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('お知らせの既読処理に失敗しました:', error);
    }
  };

  const getIconComponent = (icon: string | null, color: string | null) => {
    const bgColorClass = 
      color === 'red' ? 'bg-red-100' : 
      color === 'green' ? 'bg-green-100' : 
      color === 'blue' ? 'bg-blue-100' : 
      color === 'purple' ? 'bg-purple-100' : 'bg-gray-100';

    const textColorClass = 
      color === 'red' ? 'text-red-500' : 
      color === 'green' ? 'text-green-500' : 
      color === 'blue' ? 'text-blue-500' : 
      color === 'purple' ? 'text-purple-500' : 'text-gray-500';

    switch (icon) {
      case 'new_feature':
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      case 'maintenance':
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case 'campaign':
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`p-2 rounded-full ${bgColorClass}`}>
            <svg className={`w-5 h-5 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ja });
    } catch (error) {
      return '日時不明';
    }
  };

  // 通知タブの内容
  const renderNotificationsTab = () => (
    <div className="py-2">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 border-b border-gray-100 last:border-b-0 ${!notification.is_read ? 'font-semibold' : ''}`}
          >
            <div className="flex-1 text-sm">
              <div>{notification.content}</div>
              <div className="text-gray-500 mt-1 text-xs">{notification.time}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="px-4 py-6 text-center text-gray-500">
          通知はありません
        </div>
      )}
    </div>
  );

  // お知らせタブの内容
  const renderAnnouncementsTab = () => (
    <div className="py-2">
      {loading ? (
        <div className="animate-pulse p-4">
          <div className="h-4 bg-gray-200 rounded mb-3 w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      ) : announcements.length > 0 ? (
        <AnimatePresence>
          {announcements.map((announcement) => (
            <motion.div 
              key={announcement.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 border-b border-gray-100 last:border-b-0 ${!announcement.is_read ? 'font-semibold' : ''}`}
              onClick={() => markAnnouncementAsRead(announcement.id)}
            >
              {getIconComponent(announcement.icon, announcement.icon_color)}
              <div className="flex-1 text-sm">
                <div className="font-medium">{announcement.title}</div>
                <div>{announcement.content}</div>
                <div className="text-gray-500 mt-1 text-xs">{getTimeAgo(announcement.start_date)}</div>
              </div>
              <AnimatePresence>
                {!announcement.is_read && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-2 h-2 bg-blue-500 rounded-full mt-2"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        <div className="px-4 py-6 text-center text-gray-500">
          お知らせはありません
        </div>
      )}
    </div>
  );

  return (
    <div ref={dropdownRef} className="bg-white rounded-md shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
      <div className="border-b sticky top-0 bg-white z-10 flex items-center">
        <div className="flex-1 flex items-center">
          <button 
            className={`flex-1 py-3 px-4 font-medium text-sm text-center ${
              activeTab !== '通知' ? 'text-gray-500' : 'text-black border-b-2 border-black'
            }`}
            onClick={() => handleTabChange('通知')}
          >
            通知
            {unreadNotifications > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-1.5 h-5 text-xs text-white font-bold rounded-full bg-red-500">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button 
            className={`flex-1 py-3 px-4 font-medium text-sm text-center relative ${
              activeTab !== 'お知らせ' ? 'text-gray-500' : 'text-black border-b-2 border-black'
            }`}
            onClick={() => handleTabChange('お知らせ')}
          >
            お知らせ
            {unreadAnnouncements > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-1.5 h-5 text-xs text-white font-bold rounded-full bg-red-500">
                {unreadAnnouncements}
              </span>
            )}
          </button>
        </div>
        {onClose && (
          <button 
            onClick={() => {
              // 閉じる前に既読処理を確実に実行
              if (activeTab === 'お知らせ' && unreadAnnouncements > 0) {
                markAllAnnouncementsRead();
              }
              
              // 少し遅延させて確実に既読処理が完了してから閉じる
              setTimeout(() => {
                if (onClose) onClose();
              }, 100);
            }}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {activeTab === '通知' ? renderNotificationsTab() : renderAnnouncementsTab()}
      </div>
    </div>
  );
};

export default HeaderAnnouncements; 