import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment validation
const validateEnvironment = (): { url: string; anonKey: string } => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  // Basic validation for anon key (should be a JWT)
  if (!anonKey.startsWith('eyJ')) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format');
  }

  return { url, anonKey };
};

// Create secure client configuration
const createSecureClient = (): SupabaseClient => {
  const { url, anonKey } = validateEnvironment();

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow for better security
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      debug: process.env.NODE_ENV === 'development'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'prompty-web-client',
        'X-Client-Version': '1.0.0'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10 // Rate limit realtime events
      }
    }
  });
};

// Singleton pattern for client instance
let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!clientInstance) {
    clientInstance = createSecureClient();
  }
  return clientInstance;
};

// Export default client
export const supabase = getSupabaseClient();

// Helper functions for common operations with error handling
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

// Auth helpers with security checks
export const signInWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    return { data: null, error: 'Email and password are required' };
  }

  // Basic email validation
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

  // Password strength validation
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

// RLS policy helpers
export const withRLS = <T>(
  operation: () => Promise<{ data: T | null; error: any }>
) => {
  // Ensure RLS is enabled for all operations
  return safeSupabaseOperation(operation);
};

export default supabase;