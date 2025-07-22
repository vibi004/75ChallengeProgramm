import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://zuidhonvxdkajbpxzrqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aWRob252eGRrYWpicHh6cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxODgsImV4cCI6MjA2ODc2MDE4OH0.h_nChhGolqWHwpXp6v1KZhPeAt13G_sWeYxi7sI8AwQ'
export const supabase = createClient(supabaseUrl, supabaseKey)