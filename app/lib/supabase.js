import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://teyrhtycsuswwnxhajfc.supabase.co';
// "View legacy API keys" থেকে পাওয়া anon public key-টি নিচে দিন:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleXJodHljc3Vzd3dueGhhamZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTc5MjIsImV4cCI6MjEwOTM3MzkyMn0.BaNLfYeJ1-DtTSDsZ3UuiNSCAFgnLThOOKuXxVCG1LE'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});