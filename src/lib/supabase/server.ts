import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !anon) {
  throw new Error(
    `Missing Supabase env vars:
     NEXT_PUBLIC_SUPABASE_URL=${url ? "✓" : "✗"}
     NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon ? "✓" : "✗"}
     → Vérifie ton fichier .env.local à la racine.`
  );
}

export function createClient() {
  const cookieStore = cookies();
  
  return createSupabaseClient(url, anon, {
    auth: {
      persistSession: false,
    },
  });
}
