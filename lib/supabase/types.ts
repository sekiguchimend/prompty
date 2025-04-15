export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          title: string
          description: string
          content: string
          image_url: string | null
          user_id: string
          category_id: number
          is_premium: boolean
          price: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          content: string
          image_url?: string | null
          user_id: string
          category_id: number
          is_premium?: boolean
          price?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content?: string
          image_url?: string | null
          user_id?: string
          category_id?: number
          is_premium?: boolean
          price?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      likes: {
        Row: {
          id: number
          user_id: string
          prompt_id: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          prompt_id: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          prompt_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          content: string
          user_id: string
          prompt_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          content: string
          user_id: string
          prompt_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          content?: string
          user_id?: string
          prompt_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          prompt_id: string
          amount: number
          payment_status: string
          payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_id: string
          amount: number
          payment_status: string
          payment_intent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_id?: string
          amount?: number
          payment_status?: string
          payment_intent_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 