import { createClient } from '@supabase/supabase-js'

// TypeScript types
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          payment_id: string
          amount: number
          description: string
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          payment_method: string
          payment_url?: string
          qr_code?: string
          metadata?: any
          created_at: string
          updated_at: string
          expired_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

// Debug environment variables
console.log('🔍 Environment Debug:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing',
  NODE_ENV: process.env.NODE_ENV,
  allEnv: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Supabase Environment Check:', {
  url: supabaseUrl ? '✅ Found' : '❌ Missing',
  anonKey: supabaseAnonKey ? '✅ Found' : '❌ Missing',
  serviceRoleKey: supabaseServiceRoleKey ? '✅ Found' : '❌ Missing',
  urlValue: supabaseUrl,
  NODE_ENV: process.env.NODE_ENV
})

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing from environment variables')
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables')
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
}

// Client-side supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side supabase admin client (chỉ dùng trong API routes)
export const getSupabaseAdmin = () => {
  if (!supabaseServiceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing from environment variables')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Alternative export method
export const supabaseAdmin = (() => {
  if (!supabaseServiceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, admin client will not work')
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
})()