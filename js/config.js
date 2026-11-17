const SUPABASE_URL = "https://wueuzoaydpamsyaeczrb.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable__GkkzT2KKcl4oMEoGE6CJg_OkQABy7G";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;