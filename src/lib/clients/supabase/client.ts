// 非推奨: secure版を使用してください
export { supabase as getSupabaseClient, supabase } from '../../supabase/client-secure';
export { safeSupabaseOperation } from '../../supabase/client-secure';
export { getCurrentUser, getCurrentSession } from '../../supabase/client-secure';
export { supabase as default } from '../../supabase/client-secure';