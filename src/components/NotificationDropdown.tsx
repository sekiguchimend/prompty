import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface NotificationItem {
  id: number;
  type: 'achievement' | 'alert' | 'gift' | 'like';
  icon: JSX.Element;
  content: JSX.Element | string;
  time: string;
}

type TabType = 'notifications' | 'announcements';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(3);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(2);
  
  // Mock notification data
  const notifications: NotificationItem[] = [
    {
      id: 1,
      type: 'achievement',
      icon: <div className="bg-yellow-100 p-2 rounded-full"><span className="text-yellow-500 text-xl">🏆</span></div>,
      content: <><span className="font-bold">1周年記念</span> のバッジを獲得</>,
      time: '1ヵ月前'
    },
    {
      id: 2,
      type: 'alert',
      icon: <div className="bg-yellow-100 p-2 rounded-full"><span className="text-yellow-500 text-xl">⚠️</span></div>,
      content: '記事購入に使える200ポイントの有効期限は1/6までです',
      time: '3ヵ月前'
    },
    {
      id: 3,
      type: 'gift',
      icon: <div className="bg-red-100 p-2 rounded-full"><span className="text-red-400 text-xl">🎁</span></div>,
      content: '次回の有料記事購入に使えるnoteポイント 200ポイントを獲得しました【1/6まで有効】',
      time: '4ヵ月前'
    },
    {
      id: 4,
      type: 'like',
      icon: <div className="bg-red-100 p-2 rounded-full"><span className="text-red-500 text-xl">❤️</span></div>,
      content: <>
        <div className="">
          <img src="https://github.com/shadcn.png" alt="User" className="w-6 h-6 rounded-full" />
          <span className="font-bold">楽しみ順子</span> さんが <span className="font-bold">塾の悩みを解決？！生徒の「遅刻、事故、授業...</span>
        </div>
        <div className="ml-8">にスキしました</div>
      </>,
      time: ''
    }
  ];

  // モックお知らせデータ
  const announcements: NotificationItem[] = [
    {
      id: 101,
      type: 'alert',
      icon: <div className="bg-blue-100 p-2 rounded-full"><span className="text-blue-500 text-xl">📢</span></div>,
      content: <><span className="font-bold">新機能のお知らせ:</span> プロンプトシェア機能がリリースされました。</>,
      time: '1日前'
    },
    {
      id: 102,
      type: 'alert',
      icon: <div className="bg-green-100 p-2 rounded-full"><span className="text-green-500 text-xl">🔄</span></div>,
      content: 'システムメンテナンスのお知らせ：12/15 AM2:00〜AM5:00にメンテナンスを実施します',
      time: '1週間前'
    },
    {
      id: 103,
      type: 'gift',
      icon: <div className="bg-purple-100 p-2 rounded-full"><span className="text-purple-500 text-xl">🎉</span></div>,
      content: '冬のキャンペーン：プレミアム会員が30%オフになります。12/25まで',
      time: '2週間前'
    }
  ];

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
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark as read when opening, depending on active tab
      if (activeTab === 'notifications') {
        setUnreadCount(0);
      } else {
        setUnreadAnnouncementsCount(0);
      }
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Mark as read when switching tabs
    if (tab === 'notifications') {
      setUnreadCount(0);
    } else {
      setUnreadAnnouncementsCount(0);
    }
  };

  // 現在選択されているタブのデータを取得
  const activeData = activeTab === 'notifications' ? notifications : announcements;
  
  // 未読の合計数を計算
  const totalUnreadCount = unreadCount + unreadAnnouncementsCount;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" 
        onClick={toggleDropdown}
        aria-label="通知"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {totalUnreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center text-xs text-white font-bold rounded-full bg-red-500">
            {totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-[80vh] overflow-y-auto">
          <div className="border-b sticky top-0 bg-white z-10">
            <div className="flex">
              <button 
                className={`flex-1 py-3 px-4 font-medium text-sm text-center ${activeTab !== 'notifications' ? 'text-gray-500' : 'text-black border-b-2 border-black'}`}
                onClick={() => handleTabChange('notifications')}
              >
                通知
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 h-5 text-xs text-white font-bold rounded-full bg-red-500">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button 
                className={`flex-1 py-3 px-4 font-medium text-sm text-center relative ${activeTab !== 'announcements' ? 'text-gray-500' : 'text-black border-b-2 border-black'}`}
                onClick={() => handleTabChange('announcements')}
              >
                お知らせ
                {unreadAnnouncementsCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 h-5 text-xs text-white font-bold rounded-full bg-red-500">
                    {unreadAnnouncementsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="py-2">
            {activeData.length > 0 ? (
              activeData.map((item) => (
                <div 
                  key={item.id} 
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 border-b border-gray-100 last:border-b-0"
                >
                  {item.icon}
                  <div className="flex-1 text-sm">
                    <div>{item.content}</div>
                    {item.time && <div className="text-gray-500 mt-1 text-xs">{item.time}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                {activeTab === 'notifications' ? '通知はありません' : 'お知らせはありません'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;