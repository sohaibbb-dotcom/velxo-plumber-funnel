import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseSecretKey) {
  throw new Error("Missing environment variable: SUPABASE_SECRET_KEY");
}

/**
 * Server-only Supabase client authenticated with the secret (service role)
 * key. Bypasses Row Level Security — use only in server-side code (API
 * routes, server actions). The `server-only` import makes any accidental
 * client-component import a build-time error.
 */
export const supabaseServer = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
