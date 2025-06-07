const validateSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  if (!anonKey.startsWith('eyJ')) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format');
  }

  return { url, anonKey, serviceKey };
};

export const supabaseConfig = validateSupabaseConfig();

export const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
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
      eventsPerSecond: 10
    }
  }
};

export const adminOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'X-Client-Info': 'prompty-admin-client'
    },
  },
};