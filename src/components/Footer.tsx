"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';

// 最適化されたリンククリック時のラッパーコンポーネント
const LinkWrapper = React.memo(({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) => {
  return (
    <Link href={to} className={className} prefetch={false}>
      {children}
    </Link>
  );
});

LinkWrapper.displayName = 'LinkWrapper';

const Footer: React.FC = () => {
  // フッターリンクの定義をuseMemoで最適化
  const footerLinks = useMemo(() => [
    {
      category: 'Prompty',
      links: [
        { text: 'ビジネス', url: '/business' },
        { text: 'フィードバック', url: '/feedback' }
      ]
    },
    {
      category: 'サービス',
      links: [
        { text: 'プレミアム', url: '/premium' },
        { text: 'コンテスト', url: '/contest-page' }
      ]
    },
    {
      category: 'ヘルプ',
      links: [
        { text: 'ヘルプセンター', url: '/help-center' },
        { text: 'お問い合わせ', url: '/contact' }
      ]
    },
    {
      category: '法的情報',
      links: [
        { text: '利用規約', url: '/terms' },
        { text: 'プライバシーポリシー', url: '/privacy' },
        { text: '特定商取引法', url: '/payment-disclosure' }
      ]
    }
  ], []);

  // 全てのリンクをフラットな配列に変換（モバイル表示用）- useMemoで最適化
  const allLinks = useMemo(() => 
    footerLinks.flatMap(category => 
      category.links.map(link => ({ text: link.text, url: link.url }))
    ), [footerLinks]
  );

  // 現在の年をuseMemoで最適化
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="bg-white border-t border-gray-200 py-12 mt-8 relative z-10">
      <div className="container mx-auto px-4 md:px-8">
        {/* モバイル表示時のフッターナビゲーション (中央寄せ) */}
        <div className="md:hidden">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            {/* 3つずつリンクを横に並べる */}
            {[0, 1, 2].map((rowIndex) => (
              <div key={rowIndex} className="flex space-x-4">
                {allLinks.slice(rowIndex * 3, (rowIndex + 1) * 3).map((link, index) => (
                  <LinkWrapper 
                    key={`${rowIndex}-${index}`}
                    to={link.url} 
                    className="text-xs text-gray-600 hover:text-gray-900 whitespace-nowrap"
                  >
                    {link.text}
                  </LinkWrapper>
                ))}
              </div>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>© {currentYear} Prompty, Inc.</p>
          </div>
        </div>
        
        {/* デスクトップ表示時のフッター (従来のレイアウト) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-8 max-w-5xl mx-auto">
            {footerLinks.map((category, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold mb-3">{category.category}</h3>
                <ul className="space-y-2">
                  {category.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <LinkWrapper to={link.url} className="text-gray-600 text-sm hover:text-gray-900">
                        {link.text}
                      </LinkWrapper>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center max-w-5xl mx-auto">
            <div className="text-sm text-gray-500">
              <p>© {currentYear} Prompty, Inc.</p>
            </div>
            
            <div className="flex space-x-6">
              <a href="https://twitter.com/prompty" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              
              <a href="https://github.com/prompty" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
