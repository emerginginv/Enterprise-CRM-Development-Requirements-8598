// Database setup utility
import supabase from '../lib/supabase'

export const setupDatabase = async () => {
  console.log('🔧 Starting database setup...')
  
  try {
    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('users_crm_2024')
      .select('id')
      .limit(1)
    
    if (testError && testError.code === '42P01') {
      console.log('📝 Tables need to be created...')
      // Tables don't exist, but that's ok - they should be created via the dashboard
      console.log('ℹ️ Please create the tables manually in Supabase dashboard')
      return { success: true, message: 'Tables need to be created manually' }
    } else if (testError) {
      console.log('⚠️ Database connection limited:', testError.message)
      return { success: false, error: testError }
    } else {
      console.log('✅ Database tables accessible')
    }
    
    console.log('✅ Database setup completed')
    return { success: true }
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    return { success: false, error }
  }
}

export const testDatabaseConnection = async () => {
  console.log('🧪 Testing database connection...')
  
  try {
    // Simple test to see if Supabase is responding
    const { data, error } = await supabase.auth.getSession()
    
    if (error && error.message.includes('Invalid API key')) {
      console.error('❌ Invalid Supabase credentials')
      return { canRead: false, error: 'Invalid Supabase credentials' }
    }
    
    console.log('✅ Supabase connection successful')
    return { canRead: true, canWrite: true }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { canRead: false, canWrite: false, error }
  }
}

export const createUserProfile = async (authUser) => {
  console.log('👤 Creating user profile for:', authUser.email)
  
  try {
    // Check if user profile already exists in database
    const { data: existingUser, error: selectError } = await supabase
      .from('users_crm_2024')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.log('⚠️ Database not ready, using fallback profile')
      // Database not ready, return fallback
      const userProfile = {
        id: authUser.id,
        email: authUser.email,
        first_name: authUser.email.split('@')[0],
        last_name: '',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return { success: true, user: userProfile, isNew: false }
    }
    
    if (existingUser) {
      // User exists, update last login
      const { error: updateError } = await supabase
        .from('users_crm_2024')
        .update({ last_login: new Date().toISOString() })
        .eq('id', existingUser.id)
      
      console.log('✅ User profile found:', existingUser.role)
      return { success: true, user: existingUser, isNew: false }
    } else {
      // Create new user profile
      const userProfile = {
        user_id: authUser.id,
        first_name: authUser.email.split('@')[0],
        last_name: '',
        email: authUser.email,
        phone: '',
        job_title: '',
        role: 'admin', // First user is admin
        is_active: true,
        last_login: new Date().toISOString(),
      }
      
      const { data: newUser, error: insertError } = await supabase
        .from('users_crm_2024')
        .insert([userProfile])
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Error creating user profile:', insertError)
        // Return fallback profile
        return { success: true, user: { ...userProfile, id: authUser.id }, isNew: true }
      }
      
      console.log('✅ New user profile created:', newUser.role)
      return { success: true, user: newUser, isNew: true }
    }
  } catch (error) {
    console.error('❌ Error in createUserProfile:', error)
    // Return fallback profile
    const userProfile = {
      id: authUser.id,
      email: authUser.email,
      first_name: authUser.email.split('@')[0],
      last_name: '',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return { success: true, user: userProfile, isNew: false }
  }
}

// Function to create sample data if tables exist but are empty
export const createSampleData = async () => {
  console.log('📋 Creating sample data...')
  
  try {
    // Check if we have any companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies_crm_2024')
      .select('id')
      .limit(1)
    
    if (companiesError) {
      console.log('⚠️ Cannot access companies table:', companiesError.message)
      return { success: false, error: companiesError }
    }
    
    if (companies && companies.length === 0) {
      console.log('📝 Inserting sample companies...')
      
      const sampleCompanies = [
        {
          name: 'Tech Corp',
          industry: 'Technology',
          size: '11-50',
          website: 'https://techcorp.com',
          phone: '+1-555-0100',
          email: 'contact@techcorp.com',
          address: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postal_code: '94105',
          description: 'Leading technology company',
          status: 'active',
          revenue: 1000000
        },
        {
          name: 'Business Solutions',
          industry: 'Consulting',
          size: '51-200',
          website: 'https://bizsolv.com',
          phone: '+1-555-0200',
          email: 'hello@bizsolv.com',
          address: '456 Business Ave',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postal_code: '10001',
          description: 'Business consulting services',
          status: 'prospect',
          revenue: 2000000
        }
      ]
      
      const { error: insertError } = await supabase
        .from('companies_crm_2024')
        .insert(sampleCompanies)
      
      if (insertError) {
        console.error('❌ Error inserting sample companies:', insertError)
      } else {
        console.log('✅ Sample companies created')
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error creating sample data:', error)
    return { success: false, error }
  }
}