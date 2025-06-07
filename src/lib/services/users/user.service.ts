import { SupabaseClient } from '@supabase/supabase-js';
import { UserRepository } from '../../repositories/user.repository';
import { User, UserProfile } from '../../../types/entities/user';
import { supabase } from '../../clients/supabase/client';

export class UserService {
  private repository: UserRepository;

  constructor(private db: SupabaseClient = supabase) {
    this.repository = new UserRepository(this.db);
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.repository.findById(userId);
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    return this.repository.findByUsername(username);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    this.validateProfileData(data);
    return this.repository.update(userId, data);
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return this.repository.search(query, limit);
  }

  async getFollowers(userId: string): Promise<User[]> {
    return this.repository.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<User[]> {
    return this.repository.getFollowing(userId);
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const isAlreadyFollowing = await this.repository.checkFollowStatus(followerId, followingId);
    if (isAlreadyFollowing) {
      throw new Error('Already following this user');
    }

    await this.repository.follow(followerId, followingId);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.repository.unfollow(followerId, followingId);
  }

  async checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
    return this.repository.checkFollowStatus(followerId, followingId);
  }

  private validateProfileData(data: Partial<User>): void {
    if (data.username && !/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
      throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
    }

    if (data.display_name && data.display_name.length > 50) {
      throw new Error('Display name cannot exceed 50 characters');
    }

    if (data.bio && data.bio.length > 500) {
      throw new Error('Bio cannot exceed 500 characters');
    }
  }
}

export const userService = new UserService();