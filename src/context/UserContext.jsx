import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'
import supabase from '../lib/supabase'

// Predefined roles with permissions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
}

export const PERMISSIONS = {
  // User permissions
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  // Company permissions
  MANAGE_COMPANIES: 'manage_companies',
  VIEW_COMPANIES: 'view_companies',
  // Contact permissions
  MANAGE_CONTACTS: 'manage_contacts',
  VIEW_CONTACTS: 'view_contacts',
  // Deal permissions
  MANAGE_DEALS: 'manage_deals',
  VIEW_DEALS: 'view_deals',
  // Task permissions
  MANAGE_TASKS: 'manage_tasks',
  VIEW_TASKS: 'view_tasks',
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
}

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.VIEW_COMPANIES,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.MANAGE_DEALS,
    PERMISSIONS.VIEW_DEALS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.VIEW_COMPANIES,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.MANAGE_DEALS,
    PERMISSIONS.VIEW_DEALS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_COMPANIES,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.MANAGE_DEALS,
    PERMISSIONS.VIEW_DEALS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_COMPANIES,
    PERMISSIONS.VIEW_CONTACTS,
    PERMISSIONS.VIEW_DEALS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_REPORTS,
  ],
}

// Demo users for fallback when database connection fails
const DEMO_USERS = [
  {
    id: '1',
    user_id: 'auth_1',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    phone: '+1-555-1234',
    job_title: 'System Administrator',
    role: 'admin',
    is_active: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'auth_2',
    first_name: 'Sales',
    last_name: 'Manager',
    email: 'manager@example.com',
    phone: '+1-555-5678',
    job_title: 'Sales Manager',
    role: 'manager',
    is_active: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 'auth_3',
    first_name: 'Sales',
    last_name: 'Rep',
    email: 'rep@example.com',
    phone: '+1-555-9012',
    job_title: 'Sales Representative',
    role: 'user',
    is_active: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    user_id: 'auth_4',
    first_name: 'Guest',
    last_name: 'Viewer',
    email: 'viewer@example.com',
    phone: '+1-555-3456',
    job_title: 'Guest User',
    role: 'viewer',
    is_active: false,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const UserManagementContext = createContext()

export const useUserManagement = () => {
  const context = useContext(UserManagementContext)
  if (!context) {
    throw new Error('useUserManagement must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const { user: currentAuthUser, isAuthenticated } = useAuth()
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [databaseConnected, setDatabaseConnected] = useState(false)

  // Initialize when authenticated
  useEffect(() => {
    if (isAuthenticated && currentAuthUser) {
      console.log('👤 Initializing user management...')
      loadUsers()
    }
  }, [isAuthenticated, currentAuthUser])

  // Load users from database or fallback to demo data
  const loadUsers = async () => {
    try {
      setLoading(true)

      // Try to fetch users from database
      const { data: dbUsers, error } = await supabase
        .from('users_crm_2024')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.log('⚠️ Database error, using demo data:', error.message)
        setUsers(DEMO_USERS)
        setDatabaseConnected(false)

        // Find current user in demo data
        const currentUserData = DEMO_USERS.find(u => 
          u.email.toLowerCase() === currentAuthUser.email.toLowerCase()
        )

        if (currentUserData) {
          setCurrentUser(currentUserData)
        } else {
          // Create fallback user
          const fallbackUser = {
            id: 'temp-' + Date.now(),
            user_id: currentAuthUser.id || 'temp-auth-id',
            first_name: currentAuthUser.email.split('@')[0],
            last_name: '',
            email: currentAuthUser.email,
            role: ROLES.ADMIN,
            is_active: true,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setCurrentUser(fallbackUser)
          setUsers([...DEMO_USERS, fallbackUser])
        }
      } else {
        console.log('✅ Users loaded from database:', dbUsers?.length || 0)
        setUsers(dbUsers || [])
        setDatabaseConnected(true)

        // Find current user in database
        const currentUserData = dbUsers?.find(u => 
          u.user_id === currentAuthUser.id || 
          u.email.toLowerCase() === currentAuthUser.email.toLowerCase()
        )

        if (currentUserData) {
          console.log('👤 Found current user in database:', currentUserData)
          setCurrentUser(currentUserData)
        } else {
          // Create user profile in database
          try {
            const newUserProfile = {
              user_id: currentAuthUser.id,
              first_name: currentAuthUser.email.split('@')[0],
              last_name: '',
              email: currentAuthUser.email,
              role: ROLES.ADMIN,
              is_active: true,
              avatar_url: null
            }

            const { data: newUser, error: insertError } = await supabase
              .from('users_crm_2024')
              .insert([newUserProfile])
              .select()
              .single()

            if (insertError) {
              console.error('❌ Error creating user profile:', insertError)
              // Use fallback
              setCurrentUser({
                id: 'temp-' + Date.now(),
                ...newUserProfile,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            } else {
              console.log('✅ Created new user profile:', newUser)
              setCurrentUser(newUser)
              setUsers(prev => [...prev, newUser])
            }
          } catch (createError) {
            console.error('❌ Error creating user:', createError)
          }
        }
      }
      return true
    } catch (error) {
      console.error('❌ Error in loadUsers:', error)
      setUsers(DEMO_USERS)
      setDatabaseConnected(false)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Get current user with role fallback
  const getCurrentUser = () => {
    if (currentUser) {
      return currentUser
    }

    if (currentAuthUser) {
      // Fallback for when user exists in auth but not loaded yet
      return {
        id: 'temp-' + currentAuthUser.id,
        user_id: currentAuthUser.id,
        first_name: 'User',
        last_name: '',
        email: currentAuthUser.email,
        role: ROLES.ADMIN,
        is_active: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    return null
  }

  // Permission checking function
  const hasPermission = (permission) => {
    const user = getCurrentUser()
    if (!user) return false
    const rolePermissions = ROLE_PERMISSIONS[user.role] || []
    return rolePermissions.includes(permission)
  }

  // User management functions
  const createUser = async (userData) => {
    try {
      setLoading(true)

      if (databaseConnected) {
        const newUserProfile = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone || '',
          job_title: userData.jobTitle || '',
          role: userData.role,
          is_active: true,
          avatar_url: null
        }

        const { data: newUser, error } = await supabase
          .from('users_crm_2024')
          .insert([newUserProfile])
          .select()
          .single()

        if (error) {
          throw error
        }

        setUsers(prev => [...prev, newUser])
        toast.success(`User ${userData.firstName} ${userData.lastName} created successfully`)
        return { success: true, user: newUser }
      } else {
        // Demo mode
        const newUser = {
          id: 'new-' + Date.now(),
          user_id: 'auth-' + Date.now(),
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone || '',
          job_title: userData.jobTitle || '',
          role: userData.role,
          is_active: true,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setUsers(prev => [...prev, newUser])
        toast.success(`User ${userData.firstName} ${userData.lastName} created successfully (Demo Mode)`)
        return { success: true, user: newUser }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId, userData) => {
    try {
      setLoading(true)

      if (databaseConnected) {
        const updateData = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone || '',
          job_title: userData.jobTitle || '',
          role: userData.role,
          updated_at: new Date().toISOString()
        }

        const { data: updatedUser, error } = await supabase
          .from('users_crm_2024')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single()

        if (error) {
          throw error
        }

        // Update users list
        setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user))
        
        // Update current user if it's the same user
        if (currentUser && currentUser.id === userId) {
          console.log('🔄 Updating current user in context:', updatedUser)
          setCurrentUser(updatedUser)
        }

        toast.success('User updated successfully')
        return { success: true, user: updatedUser }
      } else {
        // Demo mode
        const updatedUser = {
          ...users.find(u => u.id === userId),
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone || '',
          job_title: userData.jobTitle || '',
          role: userData.role,
          updated_at: new Date().toISOString()
        }

        setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user))
        
        // Update current user if it's the same user
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser)
        }

        toast.success('User updated successfully (Demo Mode)')
        return { success: true, user: updatedUser }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh current user data (useful after avatar uploads)
  const refreshCurrentUser = async () => {
    if (!currentAuthUser || !databaseConnected) return

    try {
      const { data: userData, error } = await supabase
        .from('users_crm_2024')
        .select('*')
        .eq('user_id', currentAuthUser.id)
        .single()

      if (!error && userData) {
        console.log('🔄 Refreshed current user data:', userData)
        setCurrentUser(userData)
        
        // Also update in the users list
        setUsers(prev => prev.map(user => 
          user.user_id === currentAuthUser.id ? userData : user
        ))
      }
    } catch (error) {
      console.error('Error refreshing current user:', error)
    }
  }

  const toggleUserStatus = async (userId, isActive) => {
    try {
      if (databaseConnected) {
        const { error } = await supabase
          .from('users_crm_2024')
          .update({ 
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          throw error
        }
      }

      setUsers(prev => prev.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          }
        }
        return user
      }))

      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
      return { success: true }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Failed to update user status')
      return { success: false }
    }
  }

  const deleteUser = async (userId) => {
    try {
      if (databaseConnected) {
        const { error } = await supabase
          .from('users_crm_2024')
          .delete()
          .eq('id', userId)

        if (error) {
          throw error
        }
      }

      setUsers(prev => prev.filter(user => user.id !== userId))
      toast.success('User deleted successfully')
      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
      return { success: false }
    }
  }

  const value = {
    users,
    groups,
    currentUser: getCurrentUser(),
    loading,
    databaseConnected,
    hasPermission,
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
    // User management
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    // Utility functions
    loadUsers,
    refreshCurrentUser,
  }

  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  )
}