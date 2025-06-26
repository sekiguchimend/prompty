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

  return { url, anonKey };
};

// Global singleton instance
let globalSupabaseInstance: SupabaseClient | null = null;
let instanceId: string | null = null;

// Create unified Supabase client with consistent configuration
const createUnifiedClient = (): SupabaseClient => {
  const { url, anonKey } = validateEnvironment();
  
  // Generate unique instance ID for debugging
  instanceId = Math.random().toString(36).substr(2, 9);

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token', // 統一されたストレージキー
      debug: process.env.NODE_ENV === 'development'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': `prompty-unified-client-${instanceId}`,
        'X-Client-Version': '1.0.0'
      }
    }
  });

  // デバッグ用：認証状態変更を監視
  if (process.env.NODE_ENV === 'development') {
    client.auth.onAuthStateChange((event, session) => {
      console.log(`🔧 [${instanceId}] Auth state changed:`, event, session?.user?.id || 'no user');
    });
  }

  return client;
};

// Get unified Supabase instance (singleton)
export const getUnifiedSupabaseClient = (): SupabaseClient => {
  if (!globalSupabaseInstance) {
    globalSupabaseInstance = createUnifiedClient();
    
    // デバッグ用ログ
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Unified Supabase client created with ID: ${instanceId}`);
    }
  }
  
  return globalSupabaseInstance;
};

// Export the unified client
export const supabase = getUnifiedSupabaseClient();

// Force reset function (for debugging)
export const resetSupabaseClient = () => {
  if (globalSupabaseInstance) {
    console.log(`🔄 Resetting Supabase client ${instanceId}`);
  }
  globalSupabaseInstance = null;
  instanceId = null;
};

// Get current instance ID (for debugging)
export const getInstanceId = () => instanceId;

// Auth state synchronization helpers
export const forceAuthSync = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('🔴 Force auth sync error:', error);
      return null;
    }
    console.log('🔄 Force auth sync completed:', data.session?.user?.id || 'no user');
    return data.session;
  } catch (error) {
    console.error('🔴 Force auth sync exception:', error);
    return null;
  }
};

export default supabase; 