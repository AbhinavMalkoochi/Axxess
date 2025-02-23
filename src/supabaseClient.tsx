import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://mgeoacbilshlbykoeome.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZW9hY2JpbHNobGJ5a29lb21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNzkxOTEsImV4cCI6MjA1NTg1NTE5MX0.1UnejFbpzVcKHu39mveNs4bcOkjs02H9Whqnu46jmf4"

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)