import { SupabaseClient } from '@supabase/supabase-js';
import { User, UserProfile } from '../../types/entities/user';
import { safeSupabaseOperation } from '../clients/supabase/client';

export class UserRepository {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
    );

    if (error) return null;
    return data;
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
    );

    if (error) return null;
    return data;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const { data: user, error } = await safeSupabaseOperation(() =>
      this.db
        .from('profiles')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );

    if (error) throw new Error(error);
    return user;
  }

  async search(query: string, limit: number = 20): Promise<User[]> {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit)
    );

    if (error) throw new Error(error);
    return data || [];
  }

  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('follows')
        .select(`
          profiles!follows_follower_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            followers_count,
            following_count,
            posts_count,
            created_at,
            updated_at
          )
        `)
        .eq('following_id', userId)
    );

    if (error) throw new Error(error);
    return data?.map(item => item.profiles).filter(Boolean) || [];
  }

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await safeSupabaseOperation(() =>
      this.db
        .from('follows')
        .select(`
          profiles!follows_following_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            followers_count,
            following_count,
            posts_count,
            created_at,
            updated_at
          )
        `)
        .eq('follower_id', userId)
    );

    if (error) throw new Error(error);
    return data?.map(item => item.profiles).filter(Boolean) || [];
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    const { error } = await safeSupabaseOperation(() =>
      this.db
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        })
    );

    if (error) throw new Error(error);

    await Promise.all([
      this.incrementFollowingCount(followerId),
      this.incrementFollowersCount(followingId)
    ]);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const { error } = await safeSupabaseOperation(() =>
      this.db
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
    );

    if (error) throw new Error(error);

    await Promise.all([
      this.decrementFollowingCount(followerId),
      this.decrementFollowersCount(followingId)
    ]);
  }

  async checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await this.db
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    return !!data;
  }

  private async incrementFollowersCount(userId: string): Promise<void> {
    await this.db.rpc('increment_followers_count', { user_id: userId });
  }

  private async decrementFollowersCount(userId: string): Promise<void> {
    await this.db.rpc('decrement_followers_count', { user_id: userId });
  }

  private async incrementFollowingCount(userId: string): Promise<void> {
    await this.db.rpc('increment_following_count', { user_id: userId });
  }

  private async decrementFollowingCount(userId: string): Promise<void> {
    await this.db.rpc('decrement_following_count', { user_id: userId });
  }
}