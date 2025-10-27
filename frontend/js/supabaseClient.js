// SmartBankPlus/frontend/js/supabaseClient.js

// ✅ Load Supabase client for browser use
// Make sure to replace the placeholders below with your actual Supabase project values.

// const SUPABASE_URL = "https://gjdzfgtvyufdiaeptywd.supabase.co";  // ← Replace with your Supabase project URL
const SUPABASE_URL = "https://tflaixnpvmrksnvskwui.supabase.co";  // ← Replace with your Supabase project URL
// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHpmZ3R2eXVmZGlhZXB0eXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTc2NDksImV4cCI6MjA3NzA3MzY0OX0.20imrgbBegw_DcmQs7YMItOOc3bjuAPnrpTZK1lmQQQ";              // ← Replace with your anon (public) API key
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbGFpeG5wdm1ya3NudnNrd3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDM4MzEsImV4cCI6MjA3NzA3OTgzMX0.1aOuldI5foFXZMEi54WkH6Ci_bghNmUeHDzvMrl8NdY";              // ← Replace with your anon (public) API key

// Create the Supabase client (v2 syntax)
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Optional: Check connection (can remove in production)
console.log("✅ Supabase client initialized:", SUPABASE_URL);
