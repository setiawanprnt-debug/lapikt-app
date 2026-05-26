import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

function maskKey(value: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

if (import.meta.env.DEV) {
  console.group("Supabase env debug");
  console.log("VITE_SUPABASE_URL:", url ? "ok" : "MISSING");
  console.log("VITE_SUPABASE_ANON_KEY:", key ? maskKey(key) : "MISSING");
  console.groupEnd();
}

if (!url || !key) {
  throw new Error(
    "Supabase environment variables are missing. " +
      "Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart Vite."
  );
}

export const supabase = createClient(url, key);
