function readRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "NEXT_PUBLIC_SUPABASE_URL") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing. Add it to .env.local before using Supabase.`);
  }

  return value;
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseEnv() {
  return {
    anonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  };
}
