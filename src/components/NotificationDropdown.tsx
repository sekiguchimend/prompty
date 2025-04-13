import React, { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [unreadCount, setUnreadCount] = useState(3);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const [headerWidth, setHeaderWidth] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });
  
  // 画面サイズとヘッダー幅を検出
  useEffect(() => {
    const updateSizeInfo = () => {
      // モバイル判定
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // ヘッダー幅の取得（モバイル時のみ）
      if (mobile) {
        const headerContainer = document.querySelector('header .container') as HTMLElement;
        if (headerContainer) {
          setHeaderWidth(headerContainer.offsetWidth);
        }
      }
    };
    
    // 初期チェック
    updateSizeInfo();
    
    // リサイズイベントのリスナー
    window.addEventListener('resize', updateSizeInfo);
    
    return () => {
      window.removeEventListener('resize', updateSizeInfo);
    };
  }, []);
  
  // ボタンとドロップダウンの位置関係を計算
  useEffect(() => {
    if (isOpen && isMobile && buttonRef.current) {
      // ボタンの位置を取得
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // bodyのマージンなどを考慮して調整
      const bodyMargin = (viewportWidth - headerWidth) / 2;
      
      // ドロップダウンを左端からの位置で配置
      setDropdownPosition({
        left: bodyMargin
      });
    }
  }, [isOpen, isMobile, headerWidth]);

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

  // 現在選択されているタブのデータを取得
  const activeData = activeTab === 'notifications' ? notifications : announcements;
  
  // 未読の合計数を計算
  const totalUnreadCount = unreadCount + unreadAnnouncementsCount;

  // スマホ表示時のドロップダウンスタイル
  const dropdownStyle = isMobile ? {
    position: 'fixed',
    top: '65px', // ヘッダー高さ
    left: dropdownPosition.left,
    width: `${headerWidth}px`,
    maxWidth: `${headerWidth}px`,
    zIndex: 50,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0
  } as React.CSSProperties : {};

  return (
    <div className="relative h-5 w-5 flex items-center justify-center" ref={dropdownRef}>
      <button 
        ref={buttonRef}
        className="relative text-gray-700 flex items-center justify-center w-full h-full" 
        onClick={toggleDropdown}
        aria-label="通知"
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-2 w-2 flex items-center justify-center text-white font-bold rounded-full bg-red-500">
            
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* PC用の引き出し部分（三角マーク） */}
          {!isMobile && (
            <div className="hidden md:block absolute top-[calc(100%+8px)] right-2 w-4 h-4 bg-white border-t border-l border-gray-200 transform rotate-45 z-[51]"></div>
          )}
          <div 
            className={isMobile 
              ? "fixed bg-white shadow-lg border-x border-b border-gray-200 overflow-y-auto max-h-[80vh]"
              : "absolute top-full right-0 mt-4 w-80 md:w-96 bg-white rounded-md shadow-lg z-50 border border-gray-200 max-h-[80vh] overflow-y-auto"
            }
            style={dropdownStyle}
          >
            <div className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center">
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
                
                <button 
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsOpen(false)}
                  aria-label="閉じる"
                >
                  <X className="h-5 w-5" />
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
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;