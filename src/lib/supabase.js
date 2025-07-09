import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zjyufjfgjaiwahlmwutp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeXVmamZnamFpd2FobG13dXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NTA5NTAsImV4cCI6MjA2NzQyNjk1MH0.pFKyyp3i0H7FJSyztKKAPn3qgZiPBZO0enPg_mEA2Mc'

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Test connection and log results
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test auth
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.warn('⚠️ Session check warning:', sessionError.message)
    } else {
      console.log('✅ Auth service connected')
    }

    // Test if we can run a simple query
    const { data, error } = await supabase
      .from('users_crm_2024')
      .select('count', { count: 'exact', head: true })

    if (error) {
      if (error.code === '42P01') {
        console.log('📋 Tables not found - will create sample data')
        return { connected: true, tablesExist: false, error: null }
      } else {
        console.error('❌ Database query error:', error)
        return { connected: false, tablesExist: false, error }
      }
    } else {
      console.log('✅ Database tables accessible')
      return { connected: true, tablesExist: true, error: null }
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return { connected: false, tablesExist: false, error }
  }
}

// Auto-test connection
if (typeof window !== 'undefined') {
  testConnection().then(result => {
    if (result.connected) {
      console.log('🎉 Supabase is ready!')
      
      // Test storage connection
      supabase.storage.listBuckets().then(({ data, error }) => {
        if (error) {
          console.warn('⚠️ Storage access limited:', error.message)
        } else {
          console.log('🗄️ Storage buckets available:', data?.map(b => b.name) || [])
        }
      })
    } else {
      console.log('⚠️ Supabase connection limited, using fallback mode')
    }
  })
}

export default supabase
export { testConnection }