import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

// Missing env vars must not crash the function at import time: /api/health still answers and
// data routes return a clear 503 (see app.js) instead of FUNCTION_INVOCATION_FAILED.
export const missingEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !process.env[k]);

export const supabase = missingEnv.length
  ? null
  : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

// A throwaway client for password checks. signInWithPassword stores the user's session on the
// client it is called on, which must never be the shared service-role client above.
export function authClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
