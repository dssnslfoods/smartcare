import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = 'https://adynnacxcnzlcrcqrqge.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
