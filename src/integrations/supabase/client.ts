import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Main app client (persisted session)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ephemeral client for admin-created signups without switching current session
export const createEphemeralSupabaseClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
