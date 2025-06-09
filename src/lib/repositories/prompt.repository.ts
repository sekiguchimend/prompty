import { SupabaseClient } from '@supabase/supabase-js';
import { Prompt, PromptWithRelations } from '../../types/entities/prompt';
import { PromptFilterDTO } from '../../types/dto/prompt.dto';
import { safeSupabaseOperation } from '../clients/supabase/client';

export class PromptRepository {
  constructor(private db: SupabaseClient) {}

  async findFeatured(limit: number = 10): Promise<PromptWithRelations[]> {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('prompts')
        .select(`
          *,
          profiles:author_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          categories:category_id (
            id,
            name,
            slug
          )
        `)
        .eq('is_featured', true)
        .eq('published', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit)
    );

    if (error) throw new Error(error);
    return data || [];
  }

  async findPopular(limit: number = 10): Promise<PromptWithRelations[]> {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('prompts')
        .select(`
          *,
          profiles:author_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          categories:category_id (
            id,
            name,
            slug
          )
        `)
        .eq('published', true)
        .eq('is_public', true)
        .order('view_count', { ascending: false })
        .order('like_count', { ascending: false })
        .limit(limit)
    );

    if (error) throw new Error(error);
    return data || [];
  }

  async findByCategory(categorySlug: string, filters?: PromptFilterDTO): Promise<PromptWithRelations[]> {
    let query = this.db
      .from('prompts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .eq('published', true)
      .eq('is_public', true);

    if (categorySlug !== 'all') {
      query = query.eq('categories.slug', categorySlug);
    }

    if (filters?.sort_by) {
      query = query.order(filters.sort_by, { 
        ascending: filters.sort_order === 'asc' 
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await safeSupabaseOperation(() => query);

    if (error) throw new Error(error);
    return data || [];
  }

  async findById(id: string, userId?: string): Promise<PromptWithRelations | null> {
    let query = this.db
      .from('prompts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .eq('id', id)
      .eq('published', true)
      .single();

    const { data, error } = await safeSupabaseOperation(() => query);

    if (error) return null;
    
    if (userId && data) {
      const [likeResult, bookmarkResult] = await Promise.all([
        this.checkUserLike(id, userId),
        this.checkUserBookmark(id, userId)
      ]);

      return {
        ...data,
        is_liked: likeResult,
        is_bookmarked: bookmarkResult
      };
    }

    return data;
  }

  async create(data: Partial<Prompt>): Promise<Prompt> {
    const { data: prompt, error } = await safeSupabaseOperation(() =>
      this.db
        .from('prompts')
        .insert(data)
        .select()
        .single()
    );

    if (error) throw new Error(error);
    if (!prompt) throw new Error('Failed to create prompt - no data returned');
    return prompt;
  }

  async update(id: string, data: Partial<Prompt>): Promise<Prompt> {
    const { data: prompt, error } = await safeSupabaseOperation(() =>
      this.db
        .from('prompts')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );

    if (error) throw new Error(error);
    if (!prompt) throw new Error('Failed to update prompt - no data returned');
    return prompt;
  }

  async delete(id: string): Promise<void> {
    const { error } = await safeSupabaseOperation(() =>
      this.db
        .from('prompts')
        .delete()
        .eq('id', id)
    );

    if (error) throw new Error(error);
  }

  async search(query: string, filters?: PromptFilterDTO): Promise<PromptWithRelations[]> {
    let dbQuery = this.db
      .from('prompts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .eq('published', true)
      .eq('is_public', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (filters?.category) {
      dbQuery = dbQuery.eq('categories.slug', filters.category);
    }

    if (filters?.sort_by) {
      dbQuery = dbQuery.order(filters.sort_by, { 
        ascending: filters.sort_order === 'asc' 
      });
    }

    if (filters?.limit) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    const { data, error } = await safeSupabaseOperation(() => dbQuery);

    if (error) throw new Error(error);
    return data || [];
  }

  async findByUserId(userId: string, filters?: PromptFilterDTO): Promise<PromptWithRelations[]> {
    let query = this.db
      .from('prompts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .eq('author_id', userId)
      .eq('published', true);

    if (filters?.sort_by) {
      query = query.order(filters.sort_by, { 
        ascending: filters.sort_order === 'asc' 
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await safeSupabaseOperation(() => query);

    if (error) throw new Error(error);
    return data || [];
  }

  async incrementViewCount(id: string): Promise<void> {
    const { error } = await safeSupabaseOperation(() =>
      this.db.rpc('increment_view_count', { prompt_id: id })
    );

    if (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  async getStats(id: string) {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('prompts')
        .select('view_count, like_count, bookmark_count, comment_count')
        .eq('id', id)
        .single()
    );

    if (error) throw new Error(error);
    if (!data) throw new Error('Failed to get stats - no data returned');
    return data;
  }

  private async checkUserLike(promptId: string, userId: string): Promise<boolean> {
    const { data } = await this.db
      .from('likes')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  private async checkUserBookmark(promptId: string, userId: string): Promise<boolean> {
    const { data } = await this.db
      .from('bookmarks')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }
}