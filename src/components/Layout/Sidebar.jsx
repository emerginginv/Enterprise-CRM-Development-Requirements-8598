import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { useUserManagement } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationsModal from '../UI/NotificationsModal';
import * as FiIcons from 'react-icons/fi';

const {
  FiHome,
  FiUsers,
  FiBuilding,
  FiTrendingUp,
  FiCheckSquare,
  FiSettings,
  FiX,
  FiShield,
  FiSun,
  FiMoon,
  FiBell,
  FiLogOut
} = FiIcons;

const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { hasPermission, PERMISSIONS, currentUser } = useUserManagement();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Check if user has permission to view users
  const canViewUsers = hasPermission(PERMISSIONS.VIEW_USERS);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FiHome },
    { name: 'Companies', href: '/companies', icon: FiBuilding },
    { name: 'Contacts', href: '/contacts', icon: FiUsers },
    { name: 'Deals', href: '/deals', icon: FiTrendingUp },
    { name: 'Tasks', href: '/tasks', icon: FiCheckSquare },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (currentUser) {
      const firstName = currentUser.first_name || '';
      const lastName = currentUser.last_name || '';
      if (firstName && lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      }
      if (firstName) {
        return firstName.charAt(0).toUpperCase();
      }
      if (currentUser.email) {
        return currentUser.email.charAt(0).toUpperCase();
      }
    }
    
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (currentUser) {
      const firstName = currentUser.first_name || '';
      const lastName = currentUser.last_name || '';
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      if (firstName) {
        return firstName;
      }
      return currentUser.email || 'User';
    }
    
    return user?.email || 'User';
  };

  // Get user avatar URL
  const getUserAvatarUrl = () => {
    if (currentUser?.avatar_url) {
      return currentUser.avatar_url;
    }
    return null;
  };

  const handleProfileClick = () => {
    // Navigate to profile section in settings
    navigate('/settings?tab=profile');
    setOpen(false); // Close sidebar on mobile
  };

  const handleNotificationsClick = () => {
    setShowNotifications(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // The logout function in AuthContext already handles navigation and cleanup
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: open ? 0 : -320 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiTrendingUp} className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              CRM Pro
            </h1>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <SafeIcon icon={item.icon} className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-around mb-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              <SafeIcon
                icon={isDark ? FiSun : FiMoon}
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
              />
            </button>

            {/* Notifications */}
            <button
              onClick={handleNotificationsClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              title="Notifications"
            >
              <SafeIcon
                icon={FiBell}
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? (
                    <span className="text-xs text-white font-bold">!</span>
                  ) : (
                    <span className="text-xs text-white font-bold">{unreadCount}</span>
                  )}
                </span>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Sign Out"
            >
              <SafeIcon
                icon={FiLogOut}
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
              />
            </button>
          </div>

          {/* User profile section - clickable */}
          <button
            onClick={handleProfileClick}
            className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            {/* Avatar - shows uploaded image or initials */}
            {getUserAvatarUrl() ? (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                <img
                  src={getUserAvatarUrl()}
                  alt={getUserDisplayName()}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div
                  className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center"
                  style={{ display: 'none' }}
                >
                  <span className="text-sm font-medium text-white">
                    {getUserInitials()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">
                  {getUserInitials()}
                </span>
              </div>
            )}
            
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View Profile</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Sidebar;