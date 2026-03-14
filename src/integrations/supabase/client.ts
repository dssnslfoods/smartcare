import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adynnacxcnzlcrcqrqge.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8';

// Using generic client since auto-generated types.ts is read-only
// Custom types are in src/types/database.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
