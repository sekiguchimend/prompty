import { SupabaseClient } from '@supabase/supabase-js';
import { PromptRepository } from '../../repositories/prompt.repository';
import { CreatePromptDTO, UpdatePromptDTO, PromptFilterDTO } from '../../../types/dto/prompt.dto';
import { Prompt, PromptWithRelations } from '../../../types/entities/prompt';
import { supabase } from '../../supabase-unified';
import { supabaseAdmin } from '../../clients/supabase/admin';

export class PromptService {
  private repository: PromptRepository;

  constructor(private db: SupabaseClient = supabase) {
    this.repository = new PromptRepository(this.db);
  }

  async getFeatured(limit: number = 10): Promise<PromptWithRelations[]> {
    return this.repository.findFeatured(limit);
  }

  async getPopular(limit: number = 10): Promise<PromptWithRelations[]> {
    return this.repository.findPopular(limit);
  }

  async getByCategory(categorySlug: string, filters?: PromptFilterDTO): Promise<PromptWithRelations[]> {
    return this.repository.findByCategory(categorySlug, filters);
  }

  async getById(id: string, userId?: string): Promise<PromptWithRelations | null> {
    const prompt = await this.repository.findById(id, userId);
    
    if (prompt) {
      await this.incrementViewCount(id);
    }
    
    return prompt;
  }

  async create(data: CreatePromptDTO, authorId: string): Promise<Prompt> {
    const promptData = {
      ...data,
      author_id: authorId,
      published: true,
      view_count: 0,
      like_count: 0,
      bookmark_count: 0,
      comment_count: 0,
    };

    return this.repository.create(promptData);
  }

  async update(id: string, data: UpdatePromptDTO, authorId: string): Promise<Prompt> {
    const existingPrompt = await this.repository.findById(id);
    
    if (!existingPrompt || existingPrompt.author_id !== authorId) {
      throw new Error('Prompt not found or unauthorized');
    }

    return this.repository.update(id, data);
  }

  async delete(id: string, authorId: string): Promise<void> {
    const existingPrompt = await this.repository.findById(id);
    
    if (!existingPrompt || existingPrompt.author_id !== authorId) {
      throw new Error('Prompt not found or unauthorized');
    }

    await this.repository.delete(id);
  }

  async search(query: string, filters?: PromptFilterDTO): Promise<PromptWithRelations[]> {
    return this.repository.search(query, filters);
  }

  async getUserPrompts(userId: string, filters?: PromptFilterDTO): Promise<PromptWithRelations[]> {
    return this.repository.findByUserId(userId, filters);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.repository.incrementViewCount(id);
  }

  async getStats(id: string) {
    return this.repository.getStats(id);
  }

  private async validatePromptData(data: CreatePromptDTO | UpdatePromptDTO): Promise<void> {
    if (data.title && data.title.trim().length < 3) {
      throw new Error('Title must be at least 3 characters long');
    }

    if (data.content && data.content.trim().length < 10) {
      throw new Error('Content must be at least 10 characters long');
    }

    if (data.price && data.price < 0) {
      throw new Error('Price cannot be negative');
    }
  }
}

export const promptService = new PromptService();