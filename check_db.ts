import { createClient } from "@supabase/supabase-js";

// Never hard-code keys here. Run with the variables from .env.local loaded.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  console.log("Projects table check:");
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
