import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig, clientOptions } from '../../config/supabase';

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!clientInstance) {
    clientInstance = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      clientOptions
    );
  }
  return clientInstance;
};

export const supabase = getSupabaseClient();

export const safeSupabaseOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const result = await operation();
    
    if (result.error) {
      console.error('Supabase operation error:', result.error);
      return {
        data: null,
        error: result.error.message || 'Database operation failed'
      };
    }
    
    return {
      data: result.data,
      error: null
    };
  } catch (error) {
    console.error('Supabase operation exception:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    return { data: null, error: 'Email and password are required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { data: null, error: 'Invalid email format' };
  }

  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Sign in failed'
    };
  }
};

export const signUpWithEmail = async (email: string, password: string, metadata?: any) => {
  if (!email || !password) {
    return { data: null, error: 'Email and password are required' };
  }

  if (password.length < 8) {
    return { data: null, error: 'Password must be at least 8 characters long' };
  }

  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Sign up failed'
    };
  }
};

export const signOut = async () => {
  try {
    const result = await supabase.auth.signOut();
    return {
      data: { success: true },
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Sign out failed'
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const result = await supabase.auth.getUser();
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get user'
    };
  }
};

export const getCurrentSession = async () => {
  try {
    const result = await supabase.auth.getSession();
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get session'
    };
  }
};

export default supabase;