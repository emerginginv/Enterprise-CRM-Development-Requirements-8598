import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import SafeIcon from '../../common/SafeIcon'
import { useAuth } from '../../context/AuthContext'
import * as FiIcons from 'react-icons/fi'

const { FiLock, FiMail, FiEye, FiEyeOff, FiStar, FiAlertCircle } = FiIcons

const Login = () => {
  const navigate = useNavigate()
  const { login, signup, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Clear any existing data on component mount
  useEffect(() => {
    console.log('🧹 Login page loaded - ensuring fresh start')
    localStorage.clear()
    sessionStorage.clear()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    
    try {
      const result = isSignUp ? await signup(email, password) : await login(email, password)
      
      if (result.success) {
        console.log('🎯 Authentication successful, redirecting...')
        
        if (isSignUp) {
          console.log('🎯 New user - redirecting to onboarding')
          navigate('/onboarding')
        } else {
          console.log('🎯 Existing user - redirecting to dashboard')
          navigate('/')
        }
      } else {
        console.error('❌ Authentication failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Auth error:', error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading screen while auth context is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Setting up your CRM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Branding Section */}
        <div className="hidden md:flex flex-col space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <SafeIcon icon={FiLock} className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CRM Pro
            </h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {isSignUp ? 'Start Your CRM Journey' : 'Welcome Back!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isSignUp 
                ? 'Join thousands of businesses that trust CRM Pro to manage their customer relationships and grow their sales.'
                : 'Sign in to access your CRM dashboard and continue managing your business relationships.'
              }
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 p-6 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-500" />
              <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-500" />
              <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-500" />
              <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-500" />
              <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-gray-800 dark:text-gray-200 font-medium">
              "CRM Pro transformed how we manage customer relationships. Sales increased by 40% in just 3 months!"
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Sarah Johnson</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">CEO at TechCorp</p>
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Why choose CRM Pro?</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>Complete customer relationship management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>Advanced sales pipeline tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>Powerful analytics and reporting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>Team collaboration tools</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Login/Signup Form */}
        <Card className="w-full max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isSignUp ? 'Create Your Account' : 'Sign In'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isSignUp ? 'Start your free CRM journey today' : 'Welcome back to CRM Pro'}
            </p>
          </div>

          {isSignUp && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">First user becomes admin!</p>
                  <p>The first person to sign up will automatically get admin privileges to manage the system.</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiMail} className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiLock} className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setEmail('')
                  setPassword('')
                }}
                className="ml-1 font-medium text-primary-600 hover:text-primary-700"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {isSignUp && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Login