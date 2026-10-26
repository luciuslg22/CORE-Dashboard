import { createClient } from '@supabase/supabase-js';

const urlSupabase = import.meta.env.VITE_SUPABASE_URL;
const chaveSupabase = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  urlSupabase,
  chaveSupabase
);