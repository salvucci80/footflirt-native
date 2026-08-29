import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = 'https://twqobdqejgbffrlczleh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cW9iZHFlamdiZmZybGN6bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjU0MTEsImV4cCI6MjA5MjgwMTQxMX0.h-2fnQaCCUOvGDHrhaFC6yD7o3HLtgIVaCJxpg7wwxo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
