import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zsjympveobnivbxiosym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzanltcHZlb2JuaXZieGlvc3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTQ4NzUsImV4cCI6MjA4MjMzMDg3NX0.Lc7etqvLeDVfQ57kvEycKFXWK25vbCZDwkIDPbq2e_I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
