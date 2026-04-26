type PublicEnvName = "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "NEXT_PUBLIC_SUPABASE_URL";
type ServerEnvName = "SUPABASE_SERVICE_ROLE_KEY";

function readRequiredEnv(name: PublicEnvName | ServerEnvName) {
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

export function hasSupabaseServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseServiceRoleKey() {
  return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}
