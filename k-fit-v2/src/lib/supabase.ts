import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;
let serviceRoleClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be initialized on the client side');
  }

  if (!supabaseClient) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

export function getServiceRoleClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be initialized on the client side');
  }

  if (!serviceRoleClient) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase service role environment variable');
    }

    serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return serviceRoleClient;
}
