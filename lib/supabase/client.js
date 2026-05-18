import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://sujjwgtpnexroauxscac.supabase.co';
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1amp3Z3RwbmV4cm9hdXhzY2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDA5MDEsImV4cCI6MjA5NDcxNjkwMX0.ara1t-Fs5Ox5vS2UxaJO_BieNJDjgmQqtAitQnwGen0';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
