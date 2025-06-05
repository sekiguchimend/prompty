import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment validation for admin client
const validateAdminEnvironment = (): { url: string; serviceKey: string } => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  // Basic validation for service key (should be a JWT)
  if (!serviceKey.startsWith('eyJ')) {
    throw new Error('Invalid SUPABASE_SERVICE_ROLE_KEY format');
  }

  return { url, serviceKey };
};

// Create secure admin client
const createSecureAdminClient = (): SupabaseClient => {
  const { url, serviceKey } = validateAdminEnvironment();

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'prompty-admin-client',
        'X-Client-Version': '1.0.0'
      }
    }
  });
};

// Singleton pattern for admin client
let adminClientInstance: SupabaseClient | null = null;

export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!adminClientInstance) {
    adminClientInstance = createSecureAdminClient();
  }
  return adminClientInstance;
};

// Export admin client
export const supabaseAdmin = getSupabaseAdminClient();

// Admin operation wrapper with enhanced error handling
export const safeAdminOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string = 'admin operation'
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const result = await operation();
    
    if (result.error) {
      console.error(`Admin ${operationName} error:`, result.error);
      
      // Don't expose sensitive admin errors to client
      const safeErrorMessage = process.env.NODE_ENV === 'development' 
        ? result.error.message 
        : 'Database operation failed';
        
      return {
        data: null,
        error: safeErrorMessage
      };
    }
    
    return {
      data: result.data,
      error: null
    };
  } catch (error) {
    console.error(`Admin ${operationName} exception:`, error);
    
    const safeErrorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error';
      
    return {
      data: null,
      error: safeErrorMessage
    };
  }
};

// Admin-specific helper functions
export const adminGetUser = async (userId: string) => {
  if (!userId || typeof userId !== 'string') {
    return { data: null, error: 'Invalid user ID' };
  }

  try {
    const result = await supabaseAdmin.auth.admin.getUserById(userId);
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

export const adminListUsers = async (page: number = 1, perPage: number = 50) => {
  if (page < 1 || perPage < 1 || perPage > 1000) {
    return { data: null, error: 'Invalid pagination parameters' };
  }

  try {
    const result = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage
    });
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to list users'
    };
  }
};

export const adminDeleteUser = async (userId: string) => {
  if (!userId || typeof userId !== 'string') {
    return { data: null, error: 'Invalid user ID' };
  }

  try {
    const result = await supabaseAdmin.auth.admin.deleteUser(userId);
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    };
  }
};

export const adminUpdateUser = async (userId: string, updates: any) => {
  if (!userId || typeof userId !== 'string') {
    return { data: null, error: 'Invalid user ID' };
  }

  // Sanitize updates to prevent injection
  const allowedFields = ['email', 'phone', 'password', 'email_confirm', 'phone_confirm', 'user_metadata', 'app_metadata'];
  const sanitizedUpdates: any = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      sanitizedUpdates[key] = updates[key];
    }
  });

  try {
    const result = await supabaseAdmin.auth.admin.updateUserById(userId, sanitizedUpdates);
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update user'
    };
  }
};

// Simplified database operations with proper error handling
export const adminSelectFromTable = async (tableName: string, filters?: any) => {
  const allowedTables = ['user_profiles', 'prompts', 'comments', 'purchases', 'payments', 'reports'];
  
  if (!allowedTables.includes(tableName)) {
    return { data: null, error: 'Table not allowed' };
  }

  try {
    let query = supabaseAdmin.from(tableName).select();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });
    }
    
    const result = await query;
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Query failed'
    };
  }
};

export const adminInsertIntoTable = async (tableName: string, data: any) => {
  const allowedTables = ['user_profiles', 'prompts', 'comments', 'purchases', 'payments', 'reports'];
  
  if (!allowedTables.includes(tableName)) {
    return { data: null, error: 'Table not allowed' };
  }

  if (!data) {
    return { data: null, error: 'Data required' };
  }

  try {
    const result = await supabaseAdmin.from(tableName).insert(data);
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Insert failed'
    };
  }
};

export const adminUpdateTable = async (tableName: string, data: any, filters: any) => {
  const allowedTables = ['user_profiles', 'prompts', 'comments', 'purchases', 'payments', 'reports'];
  
  if (!allowedTables.includes(tableName)) {
    return { data: null, error: 'Table not allowed' };
  }

  if (!data || !filters) {
    return { data: null, error: 'Data and filters required' };
  }

  try {
    let query = supabaseAdmin.from(tableName).update(data);
    
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key]);
    });
    
    const result = await query;
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Update failed'
    };
  }
};

export const adminDeleteFromTable = async (tableName: string, filters: any) => {
  const allowedTables = ['user_profiles', 'prompts', 'comments', 'purchases', 'payments', 'reports'];
  
  if (!allowedTables.includes(tableName)) {
    return { data: null, error: 'Table not allowed' };
  }

  if (!filters) {
    return { data: null, error: 'Filters required' };
  }

  try {
    let query = supabaseAdmin.from(tableName).delete();
    
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key]);
    });
    
    const result = await query;
    return {
      data: result.data,
      error: result.error?.message || null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

// Storage admin operations
export const adminStorageOperation = async (
  bucket: string,
  operation: 'list' | 'delete' | 'move' | 'copy',
  path?: string,
  newPath?: string
) => {
  if (!bucket || typeof bucket !== 'string') {
    return { data: null, error: 'Invalid bucket name' };
  }

  try {
    const storage = supabaseAdmin.storage.from(bucket);

    switch (operation) {
      case 'list':
        return safeAdminOperation(
          () => storage.list(path || ''),
          `list storage ${bucket}`
        );

      case 'delete':
        if (!path) {
          return { data: null, error: 'Path required for delete operation' };
        }
        return safeAdminOperation(
          () => storage.remove([path]),
          `delete from storage ${bucket}`
        );

      case 'move':
        if (!path || !newPath) {
          return { data: null, error: 'Both path and newPath required for move operation' };
        }
        return safeAdminOperation(
          () => storage.move(path, newPath),
          `move in storage ${bucket}`
        );

      case 'copy':
        if (!path || !newPath) {
          return { data: null, error: 'Both path and newPath required for copy operation' };
        }
        return safeAdminOperation(
          () => storage.copy(path, newPath),
          `copy in storage ${bucket}`
        );

      default:
        return { data: null, error: 'Invalid storage operation' };
    }
  } catch (error) {
    console.error(`Admin storage operation error:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Storage operation failed'
    };
  }
};

export default supabaseAdmin;