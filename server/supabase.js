require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. Create .env from .env.example');
}
const supabase = createClient(url || 'http://localhost', key || 'anon', { auth: { persistSession: false } });
module.exports = supabase;