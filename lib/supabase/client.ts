'use client';

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { anonKey, url } = getSupabaseEnv();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}
