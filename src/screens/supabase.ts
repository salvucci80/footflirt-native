
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = 'https://twqobdqejgbffrlczleh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cW9iZHFlamdiZmZybGN6bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMDI0NDgsImV4cCI6MjA2MTg3ODQ0OH0.dBFQ8Gz2-KNRawTMPUMNcoN76WZFCoBGVGisPq4GZ2A'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})