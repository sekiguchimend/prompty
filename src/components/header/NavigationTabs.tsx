import React, { useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '../../lib/utils';

interface TabItem {
  id: string;
  name: string;
  path: string;
}

interface NavigationTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = memo(({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  const router = useRouter();
  const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // キーボードナビゲーション
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        let newIndex;
        
        if (e.key === 'ArrowLeft') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }
        
        const newTab = tabs[newIndex];
        if (newTab) {
          onTabChange(newTab.id);
          tabButtonsRef.current[newIndex]?.focus();
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [activeTab, tabs, onTabChange]);

  const handleTabClick = (tab: TabItem) => {
    onTabChange(tab.id);
    
    // フォローページの場合、遷移前にデータをプリロードする
    if (tab.id === 'following') {
      router.prefetch('/following');
    }
    
    // 実際のページに遷移
    router.push(tab.path);
  };

  return (
    <nav 
      className={cn('flex space-x-1 overflow-x-auto scrollbar-hide', className)}
      role="tablist"
      aria-label="ナビゲーションタブ"
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabButtonsRef.current[index] = el;
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabClick(tab)}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {tab.name}
          </button>
        );
      })}
    </nav>
  );
});

NavigationTabs.displayName = 'NavigationTabs'; 