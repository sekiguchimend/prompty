import { UserSummary } from './user';

export interface Comment {
  id: string;
  prompt_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  is_edited?: boolean;
}

export interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
}

export interface CommentWithRelations extends Comment {
  author: UserSummary;
  replies?: CommentWithRelations[];
  reply_count?: number;
  like_count?: number;
  liked_by_user?: boolean;
  comment_likes?: CommentLike[];
}

export interface CommentTree extends CommentWithRelations {
  children: CommentTree[];
  depth: number;
  is_collapsed?: boolean;
}

// 拡張されたユーザー情報付きコメント型（Commentsコンポーネント用）
export interface CommentWithUser extends Comment {
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  like_count?: number;
  liked_by_user?: boolean;
  replies?: CommentWithUser[];
  reply_count?: number;
  is_collapsed?: boolean;
}