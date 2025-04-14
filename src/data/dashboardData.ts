import { Award, Clock, CreditCard, DollarSign, Eye, Heart, MessageSquare } from 'lucide-react';
import React from 'react';

export interface Article {
  id: string;
  title: string;
  views: number;
  comments: number;
  likes: number;
  status?: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  acquired: boolean;
  iconType: string;
}

export interface SalesSummaryItem {
  title: string;
  amount: number;
  iconType: string;
  iconColor: string;
}

export interface PaymentHistoryItem {
  id: number;
  month: string;
  amount: number;
  status: string;
  scheduledDate: string;
}

export interface SalesHistoryItem {
  id: number;
  date: string;
  itemName: string;
  price: number;
  buyer: string;
  status: string;
}

export interface SidebarItem {
  id: string;
  name: string;
  iconType: string;
}

export interface HelpContentSection {
  title: string;
  items: string[];
}

// アイコンをアイコンタイプに基づいて取得する関数
export const getIconByType = (iconType: string, className: string) => {
  switch (iconType) {
    case 'eye':
      return <Eye className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'message-square':
      return <MessageSquare className={className} />;
    case 'dollar-sign':
      return <DollarSign className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'clock':
      return <Clock className={className} />;
    default:
      return <Eye className={className} />;
  }
};

// アクセス統計情報
export const statisticsData = {
  totalViews: 349,
  totalComments: 0,
  totalLikes: 11,
  lastUpdated: '2025年4月14日 14:54'
};

// コンテンツ記事データ
export const articlesData: Article[] = [
  {
    id: '1',
    title: 'ビジネスの根幹は営業である（削除済み）',
    views: 95,
    comments: 0,
    likes: 0,
    status: '削除済み'
  },
  {
    id: '2',
    title: 'アプリを作るだけならプログラミングの知識いりません（削除済み）',
    views: 58,
    comments: 0,
    likes: 1,
    status: '削除済み'
  },
  {
    id: '3',
    title: '学生起業オススメの分野（削除済み）',
    views: 49,
    comments: 0,
    likes: 0,
    status: '削除済み'
  }
];

// バッジデータ
export const badgesData: Badge[] = [
  { 
    id: 1, 
    name: 'ファーストポスト', 
    description: '初めての投稿を行いました', 
    acquired: true, 
    iconType: 'award'
  },
  { 
    id: 2, 
    name: '10いいね達成', 
    description: '投稿が合計10いいねを獲得しました', 
    acquired: true, 
    iconType: 'heart'
  },
  { 
    id: 3, 
    name: '100ビュー達成', 
    description: '投稿が合計100ビューを達成しました', 
    acquired: true, 
    iconType: 'eye'
  },
  { 
    id: 4, 
    name: '1000ビュー達成', 
    description: '投稿が合計1000ビューを達成しました', 
    acquired: false, 
    iconType: 'eye'
  },
  { 
    id: 5, 
    name: 'コメントゲッター', 
    description: '5件以上のコメントを獲得しました', 
    acquired: false, 
    iconType: 'message-square'
  }
];

// 売上概要データ
export const salesSummaryData: SalesSummaryItem[] = [
  { title: '今月の売上', amount: 0, iconType: 'dollar-sign', iconColor: 'text-green-500' },
  { title: '累計売上', amount: 0, iconType: 'dollar-sign', iconColor: 'text-blue-500' },
  { title: '売上可能額', amount: 0, iconType: 'dollar-sign', iconColor: 'text-indigo-500' }
];

// 振込データ
export const paymentHistoryData: PaymentHistoryItem[] = [
  { id: 1, month: '2025年5月', amount: 0, status: '準備中', scheduledDate: '2025/05/15' }
];

// 販売履歴
export const salesHistoryData: SalesHistoryItem[] = [
  { id: 1, date: '----/--/--', itemName: 'まだ販売履歴はありません', price: 0, buyer: '-', status: '-' }
];

// サイドバーのメニュー項目
export const sidebarItemsData: SidebarItem[] = [
  { id: 'analytics', name: 'アクセス状況', iconType: 'eye' },
  { id: 'badges', name: 'バッジ', iconType: 'award' },
  { id: 'sales', name: '売上管理', iconType: 'dollar-sign' },
  { id: 'payments', name: '振込管理', iconType: 'credit-card' },
  { id: 'history', name: '販売履歴', iconType: 'clock' }
];

// 時間期間オプション
export const timePeriodOptions = ['週', '月', '年', '全期間'];

// ヘルプコンテンツ
export const helpContentData: HelpContentSection[] = [
  { 
    title: 'promptyのはじめかた', 
    items: [
      'もっとも大事なこと',
      '本文を書くときのポイント', 
      'タイトルと見出し画像のコツ'
    ]
  },
  { 
    title: 'promptyをもっと使いこなそう', 
    items: [
      'SNSと連携してシェア',
      '読者へのお礼を設定する',
      'コンテンツをマガジンにまとめる',
      'コンテスト・お題に参加する',
      'クリエイターとしてのキャリアを伸ばすために'
    ]
  }
]; 