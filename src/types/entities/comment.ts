import { UserSummary } from './user';

export interface Comment {
  id: string;
  prompt_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithRelations extends Comment {
  author: UserSummary;
  replies?: CommentWithRelations[];
  reply_count?: number;
}

export interface CommentTree extends CommentWithRelations {
  children: CommentTree[];
  depth: number;
}