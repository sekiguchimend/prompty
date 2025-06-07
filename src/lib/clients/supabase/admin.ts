import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig, adminOptions } from '../../config/supabase';

let adminInstance: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (typeof window !== 'undefined') {
    console.warn('Warning: supabaseAdmin should only be used on the server side');
  }
  
  if (adminInstance) return adminInstance;
  
  if (!supabaseConfig.serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Please check your environment variables.'
    );
  }
  
  adminInstance = createClient(
    supabaseConfig.url,
    supabaseConfig.serviceKey,
    adminOptions
  );
  
  return adminInstance;
};

export const supabaseAdmin = getSupabaseAdmin();

export const safeAdminOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const result = await operation();
    
    if (result.error) {
      console.error('Supabase admin operation error:', result.error);
      return {
        data: null,
        error: result.error.message || 'Admin operation failed'
      };
    }
    
    return {
      data: result.data,
      error: null
    };
  } catch (error) {
    console.error('Supabase admin operation exception:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown admin error occurred'
    };
  }
};

export default supabaseAdmin;