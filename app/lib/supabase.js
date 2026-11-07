import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://teyrhtycsuswwnxhajfc.supabase.co';
const supabaseKey = 'sb_publishable_qvXWgqxW2k5MMMBkdA3dig_lrOHtIDC';
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});