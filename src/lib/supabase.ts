import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://mzmpcshzmvwgrqayrylx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bXBjc2h6bXZ3Z3JxYXlyeWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTU5NTIsImV4cCI6MjEwMzczMTk1Mn0.NC7mebKSxHdW3Kns5RHz4F-P3gBHIKxLjDiyI4PB8nM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});