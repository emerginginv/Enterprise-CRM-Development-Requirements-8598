import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import supabase from '../lib/supabase'
import { setupDatabase, testDatabaseConnection, createUserProfile } from '../utils/setupDatabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbSetupComplete, setDbSetupComplete] = useState(false)
  const navigate = useNavigate()

  // Initialize database on app start
  useEffect(() => {
    const initializeDatabase = async () => {
      console.log('🚀 Initializing application...')
      
      try {
        // Test database connection first
        const dbTest = await testDatabaseConnection()
        
        if (dbTest.canRead) {
          console.log('✅ Database connection successful')
          await setupDatabase()
        } else {
          console.log('⚠️ Database connection limited, continuing with basic functionality')
        }
        
        setDbSetupComplete(true)
        console.log('✅ Application initialization complete')
      } catch (error) {
        console.error('❌ Application initialization failed:', error)
        setDbSetupComplete(true) // Continue anyway
      }
    }
    
    initializeDatabase()
  }, [])

  useEffect(() => {
    if (!dbSetupComplete) return

    const checkSession = async () => {
      try {
        setLoading(true)
        
        const { data } = await supabase.auth.getSession()
        
        if (data.session?.user) {
          console.log('🔍 Found existing session for:', data.session.user.email)
          
          // Create user profile
          const profileResult = await createUserProfile(data.session.user)
          
          if (profileResult.success) {
            setUser(data.session.user)
            setIsAuthenticated(true)
            console.log('✅ Session restored successfully')
          } else {
            console.error('❌ Failed to create user profile')
            setUser(null)
            setIsAuthenticated(false)
          }
        } else {
          setUser(null)
          setIsAuthenticated(false)
          console.log('ℹ️ No existing session')
        }
        
      } catch (error) {
        console.error('❌ Error checking session:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event)
        
        if (session?.user) {
          console.log('👤 User authenticated:', session.user.email)
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Create user profile
            const profileResult = await createUserProfile(session.user)
            
            if (profileResult.success) {
              setUser(session.user)
              setIsAuthenticated(true)
              
              if (profileResult.isNew) {
                toast.success(`Welcome! Account created as ${profileResult.user.role}`)
              } else {
                toast.success('Welcome back!')
              }
            } else {
              console.error('❌ Failed to create user profile:', profileResult.error)
              setUser(null)
              setIsAuthenticated(false)
            }
          } else {
            setUser(session.user)
            setIsAuthenticated(true)
          }
        } else {
          setUser(null)
          setIsAuthenticated(false)
          console.log('👋 User signed out')
        }
        setLoading(false)
      }
    )

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [dbSetupComplete])

  const login = async (email, password) => {
    try {
      console.log('🔑 Attempting login for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log('✅ Login successful!')
      return { success: true, user: data.user }
    } catch (error) {
      console.error('❌ Login error:', error.message)
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  }

  const signup = async (email, password) => {
    try {
      console.log('📝 Creating new account for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      console.log('🎉 Account created successfully!')
      return { success: true, user: data.user }
    } catch (error) {
      console.error('❌ Signup error:', error.message)
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      console.log('👋 Signing out user')
      
      await supabase.auth.signOut()
      
      // Clear all local data
      localStorage.clear()
      sessionStorage.clear()
      
      toast.success('Signed out successfully')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error.message)
      toast.error('Logout failed')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading: loading || !dbSetupComplete,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}