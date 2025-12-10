
import { createClient } from '@supabase/supabase-js';

// Safe access helper for environment variables
const getEnv = (key: string) => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore
  }
  return '';
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

const hardcodedUrl = 'https://fprzoyglvjxdampxajkb.supabase.co';
const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnpveWdsdmp4ZGFtcHhhamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTAyNzUsImV4cCI6MjA4MDk2NjI3NX0.e_YwakBnmMe2XmjnCW9WH2bObSUmJi9H7TUTehC3mXA';

// Priority: Env Vars > Hardcoded > Empty String (to avoid crash, though it wont work)
const supabaseUrl = envUrl || hardcodedUrl;
const supabaseAnonKey = envKey || hardcodedKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);