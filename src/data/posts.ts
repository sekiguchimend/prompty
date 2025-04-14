// 投稿の型定義
export interface PostItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  user: {
    name: string;
    avatarUrl: string;
    bio?: string;
    publishedAt?: string;
    website?: string;
    userId: string;
  };
  postedAt: string;
  likeCount: number;
  commentCount?: number;
  category?: string;
  content?: string[];
  price?: number;
  wordCount?: number;
  tags?: string[];
  systemImageUrl?: string;
  systemUrl?: string;
  socialLinks?: { icon: string; url: string }[];
  reviewers?: string[];
  reviewCount?: number;
  status?: 'normal' | 'following' | 'popular' | 'featured' | 'recommendation';
  isLiked?: boolean;
}

// すべての投稿データ
const allPosts: PostItem[] = [
  {
    id: '1',
    title: '不登校の生徒によって対応が違った中学校',
    thumbnailUrl: 'https://source.unsplash.com/random/200x150?school',
    user: { name: 'なみさ', avatarUrl: 'https://source.unsplash.com/random/100x100?face', userId: 'namisa123' },
    postedAt: '12',
    likeCount: 12,
    category: 'education',
    status: 'following'
  },
  {
    id: '2',
    title: 'スターオブザカラー☆お気に入りのファンデーションが製造中止...',
    thumbnailUrl: 'https://source.unsplash.com/random/200x150?makeup',
    user: { name: 'なみさ', avatarUrl: 'https://source.unsplash.com/random/100x100?face', userId: 'namisa123' },
    postedAt: '17時間前',
    likeCount: 15,
    category: 'beauty',
    status: 'following'
  },
  {
    id: '3',
    title: '中学校の教師になりたい人の心理が知りたい',
    thumbnailUrl: 'https://source.unsplash.com/random/200x150?teacher',
    user: { name: 'なみさ', avatarUrl: 'https://source.unsplash.com/random/100x100?face', userId: 'namisa123' },
    postedAt: '1日前',
    likeCount: 29,
    category: 'education',
    status: 'following'
  },
  {
    id: '4',
    title: '学校とうまくいくためには話し合いしかない',
    thumbnailUrl: 'https://source.unsplash.com/random/200x150?school',
    user: { name: 'なみさ', avatarUrl: 'https://source.unsplash.com/random/100x100?face', userId: 'namisa123' },
    postedAt: '16',
    likeCount: 16,
    category: 'education',
    status: 'following'
  },
  {
    id: '5',
    title: '学校と喧嘩してはダメだよ。',
    thumbnailUrl: 'https://source.unsplash.com/random/200x150?coffee',
    user: { name: 'なみさ', avatarUrl: 'https://source.unsplash.com/random/100x100?face', userId: 'namisa123' },
    postedAt: '34',
    likeCount: 34,
    category: 'education',
    status: 'following'
  },
  {
    id: '101',
    title: '(元) 特別支援学級担任の本音①',
    thumbnailUrl: 'https://source.unsplash.com/random/200x150?teacher',
    user: { name: 'taka_monologue', avatarUrl: 'https://i.pravatar.cc/150?img=8', userId: 'taka_monologue123' },
    postedAt: '3日前',
    likeCount: 0,
    category: 'education',
    status: 'recommendation'
  },
  {
    id: '102',
    title: '【題未定】広末涼子のニュースが、不安の心に刺さる理由...',
    thumbnailUrl: 'https://source.unsplash.com/random/200x150?news',
    user: { name: 'なみさ', avatarUrl: 'https://i.pravatar.cc/150?img=3', userId: 'namisa123' },
    postedAt: '1日前',
    likeCount: 0,
    category: 'news',
    status: 'recommendation'
  },
  // 詳細表示用の投稿データ
  {
    id: 'detail-1',
    title: '努力できないのは才能じゃなくてやり方の問題！',
    thumbnailUrl: '/lovable-uploads/92289d47-425e-44de-932b-d74594b9e9e7.png',
    content: [
      'こんにちは、末吉です。',
      'あなたがこのnoteを見つけたということは、きっとこんな悩みを持っているのかもしれません。',
      '・がんばって書いているのに、有料noteがなぜか売れない…」',
      '・あの人は簡単に売れているのに、私と何が違うんだろう…？」',
      '・自分の書いたnoteが売れていく感覚を味わってみたい…！',
      'もし1つでも当てはまるなら、このnoteはあなたのために書きました。',
      'じつは、有料noteが売れる人と売れない人の差は、「考え方」にあります。'
    ],
    user: {
      name: '末吉宏臣 / 『発信をお金にかえる勇気』',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      bio: '末吉宏臣 / 『発信をお金にかえる勇気』 著者',
      publishedAt: '2025年3月15日 11:29',
      website: 'https://hiroomisueyoshi.net/fx/mailmag',
      userId: 'hiroomisueyoshi123'
    },
    price: 3000,
    postedAt: '3日前',
    likeCount: 97,
    wordCount: 3493,
    tags: [
      '有料note', 
      '末吉宏臣'
    ],
    systemImageUrl: '/lovable-uploads/4ed80f0e-6902-4a40-92fc-56fea3e5bd1c.png',
    systemUrl: 'https://example.com/system-demo',
    socialLinks: [
      {icon: 'twitter', url: '#'},
      {icon: 'facebook', url: '#'},
      {icon: 'instagram', url: '#'},
      {icon: 'youtube', url: '#'},
      {icon: 'line', url: '#'},
      {icon: 'tiktok', url: '#'},
      {icon: 'google-business', url: '#'},
      {icon: 'rss', url: '#'}
    ],
    reviewers: [
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=2',
      'https://i.pravatar.cc/150?img=3',
      'https://i.pravatar.cc/150?img=4',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=6',
      'https://i.pravatar.cc/150?img=7'
    ],
    reviewCount: 26,
    category: 'business',
    status: 'normal'
  },
  // 人気記事
  {
    id: 'popular-1',
    title: '『夢がかなう！ ファンが増える！ エッセイの書き方』【追記】自己啓発エッセイのススメ（動画セミナー）（2023.1.11）',
    thumbnailUrl: '/lovable-uploads/4ed80f0e-6902-4a40-92fc-56fea3e5bd1c.png',
    user: { name: '末吉宏臣', avatarUrl: 'https://i.pravatar.cc/150?img=3', userId: 'hiroomisueyoshi123' },
    postedAt: '2023年1月11日',
    likeCount: 1814,
    category: 'writing',
    status: 'popular'
  },
  {
    id: 'popular-2',
    title: 'たくさんお金を受け取って、たくさん好きな人やお店や会社に回せばいい。',
    thumbnailUrl: '',
    user: { name: '末吉宏臣', avatarUrl: 'https://i.pravatar.cc/150?img=3', userId: 'hiroomisueyoshi123' },
    postedAt: '2022年12月5日',
    likeCount: 621,
    category: 'finance',
    status: 'popular'
  },
  {
    id: 'popular-3',
    title: '『お金から自由になる14のヒント』追記：大切なことをはじめるとき、まずはお金のことを忘れよう（2022.7.4）',
    thumbnailUrl: '/lovable-uploads/4ed80f0e-6902-4a40-92fc-56fea3e5bd1c.png',
    user: { name: '末吉宏臣', avatarUrl: 'https://i.pravatar.cc/150?img=3', userId: 'hiroomisueyoshi123' },
    postedAt: '2022年7月4日',
    likeCount: 1508,
    category: 'finance',
    status: 'popular'
  }
];

// フォロー中の投稿を取得
export const getFollowingPosts = (): PostItem[] => {
  return allPosts.filter(post => post.status === 'following');
};

// 今日のあなたに向けた投稿を取得
export const getTodayForYouPosts = (): PostItem[] => {
  return allPosts.filter(post => post.status === 'recommendation');
};

// 人気記事を取得
export const getPopularPosts = (): PostItem[] => {
  return allPosts.filter(post => post.status === 'popular');
};

// カテゴリ別の投稿を取得
export const getPostsByCategory = (category: string): PostItem[] => {
  return allPosts.filter(post => post.category === category);
};

// 特定の投稿IDで取得
export const getPostById = (id: string): PostItem | undefined => {
  return allPosts.find(post => post.id === id);
};

// 詳細表示用の投稿データを取得
export const getDetailPost = (): PostItem => {
  return allPosts.find(post => post.id === 'detail-1') || allPosts[0];
};

// すべての投稿を取得
export const getAllPosts = (): PostItem[] => {
  return allPosts;
};

export default allPosts; 