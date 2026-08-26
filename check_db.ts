import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ycjpezxmlhwryzxtoipg.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljanBlenhtbGh3cnl6eHRvaXBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc2NjA3OSwiZXhwIjoyMDkxMzQyMDc5fQ.Y_-k4ZKEzh2LEQNseL0nyjRzqHRVlvm7yz1YcmSz2GU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  console.log("Projects table check:");
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
