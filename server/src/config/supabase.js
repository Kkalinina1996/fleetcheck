import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const hasSupabaseConfiguration = () =>
  Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY
  )

export function getSupabaseAdminClient() {
  if (!hasSupabaseConfiguration()) {
    const error = new Error(
      'Supabase server configuration is required for this endpoint.'
    )
    error.statusCode = 503
    throw error
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}