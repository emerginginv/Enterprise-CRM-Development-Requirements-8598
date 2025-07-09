import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useUserManagement } from '../context/UserContext';
import { useCRM } from '../context/CRMContext';
import { toast } from 'react-hot-toast';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SafeIcon from '../common/SafeIcon';
import ImageUploader from '../components/UI/ImageUploader';
import useImageUpload from '../hooks/useImageUpload';
import Reports from './Reports';
import Users from './Users';
import Pricing from './Pricing';
import { debugLog, debugUserIds, runComprehensiveTest, clearDebugLogs, exportDebugLogs, getDebugLogs } from '../utils/debugUtils';
import * as FiIcons from 'react-icons/fi';

const {
  FiUser, FiMail, FiPhone, FiLock, FiBell, FiMonitor, FiSave, FiUpload, FiMoon, FiClock,
  FiAlertCircle, FiCheckCircle, FiRefreshCw, FiCalendar, FiTrendingUp, FiCheckSquare,
  FiBarChart2, FiImage, FiUsers, FiDollarSign, FiBarChart, FiBug, FiDownload, FiTrash
} = FiIcons;

const Settings = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { userPreferences, updatePreferences } = useNotifications();
  const { user } = useAuth();
  const { currentUser, updateUser, loadUsers, refreshCurrentUser } = useUserManagement();
  const { deals, contacts } = useCRM();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugResults, setDebugResults] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    avatarUrl: '',
    notifications: { ...userPreferences },
    preferences: {
      theme: isDark ? 'dark' : 'light',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
    }
  });

  const { loading: uploadLoading, uploadImage } = useImageUpload(
    'user',
    user?.id,
    async (url) => {
      if (url) {
        debugLog('SETTINGS_PAGE', 'Avatar upload callback triggered', { url });
        setFormData(prev => ({ ...prev, avatarUrl: url }));
        
        // Refresh current user data to get the updated avatar from database
        await refreshCurrentUser();
        
        // Also reload all users to update the users list
        await loadUsers();
        setIsAvatarModalOpen(false);
        toast.success('Profile picture updated successfully!');
      }
    }
  );

  // Update form data when user preferences change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...userPreferences }
    }));
  }, [userPreferences]);

  // Update form data when current user changes
  useEffect(() => {
    if (currentUser) {
      debugLog('SETTINGS_PAGE', 'Updating form data with current user', {
        currentUser: {
          id: currentUser.id,
          user_id: currentUser.user_id,
          email: currentUser.email,
          avatar_url: currentUser.avatar_url
        }
      });
      
      setFormData(prev => ({
        ...prev,
        firstName: currentUser.first_name || '',
        lastName: currentUser.last_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        position: currentUser.job_title || '',
        avatarUrl: currentUser.avatar_url || ''
      }));
    }
  }, [currentUser]);

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'notifications', 'preferences', 'security', 'reports', 'users', 'pricing', 'debug'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Debug user IDs when component mounts and when user data changes
  useEffect(() => {
    if (user && currentUser) {
      debugUserIds(user, currentUser);
    }
  }, [user, currentUser]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'preferences', name: 'Preferences', icon: FiMonitor },
    { id: 'security', name: 'Security', icon: FiLock },
    { id: 'reports', name: 'Reports', icon: FiBarChart },
    { id: 'users', name: 'Users', icon: FiUsers },
    { id: 'pricing', name: 'Pricing', icon: FiDollarSign },
    { id: 'debug', name: 'Debug', icon: FiBug },
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleChannelPreferenceChange = (type, channel, value) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        channelPreferences: {
          ...prev.notifications.channelPreferences,
          [type]: {
            ...prev.notifications.channelPreferences[type],
            [channel]: value
          }
        }
      }
    }));
  };

  const handleSave = async () => {
    debugLog('SETTINGS_PAGE', 'Save button clicked', {
      activeTab,
      formData: activeTab === 'profile' ? {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position
      } : 'Not profile tab'
    });

    // Save notification preferences to context and localStorage
    updatePreferences(formData.notifications);

    // Update user profile if in profile tab
    if (activeTab === 'profile' && currentUser) {
      try {
        debugLog('SETTINGS_PAGE', 'Updating user profile', {
          currentUserId: currentUser.id,
          updateData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            jobTitle: formData.position
          }
        });

        await updateUser(currentUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          jobTitle: formData.position
        });
        
        debugLog('SETTINGS_PAGE', 'User profile updated successfully');
        toast.success('Profile updated successfully!');
      } catch (error) {
        debugLog('SETTINGS_PAGE', 'Error updating user profile', {
          error: error.message,
          stack: error.stack
        });
        console.error('Error updating user profile:', error);
        toast.error('Failed to update profile');
        return;
      }
    }

    // For other settings, this would connect to a backend
    if (activeTab !== 'profile') {
      toast.success('Settings saved successfully!');
    }
  };

  const handleReset = () => {
    // Reset to default notification settings
    const defaultPreferences = {
      email: true,
      push: true,
      sms: false,
      deals: true,
      tasks: true,
      reports: false,
      quietHours: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      allowCritical: true,
      digest: 'none',
      channelPreferences: {
        deals: { email: true, push: true, sms: false },
        tasks: { email: true, push: true, sms: false },
        reports: { email: true, push: false, sms: false }
      }
    };

    setFormData(prev => ({
      ...prev,
      notifications: defaultPreferences
    }));

    // Update context and localStorage
    updatePreferences(defaultPreferences);
    toast.success('Notification settings reset to defaults!');
  };

  const handleAvatarUpload = async (file) => {
    debugLog('SETTINGS_PAGE', 'Avatar upload initiated', {
      fileName: file?.name,
      fileSize: file?.size,
      userId: user?.id,
      userIdType: typeof user?.id
    });
    
    await uploadImage(file);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Debug panel functions
  const runComprehensiveDebugTest = async () => {
    setIsRunningTest(true);
    debugLog('SETTINGS_DEBUG', 'Starting comprehensive debug test');
    
    try {
      const results = await runComprehensiveTest(user, currentUser);
      setDebugResults(results);
      debugLog('SETTINGS_DEBUG', 'Debug test completed', { results });
    } catch (error) {
      debugLog('SETTINGS_DEBUG', 'Debug test failed', { error: error.message });
      toast.error('Debug test failed: ' + error.message);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleClearLogs = () => {
    clearDebugLogs();
    setDebugResults(null);
    toast.success('Debug logs cleared');
  };

  const handleExportLogs = () => {
    exportDebugLogs();
    toast.success('Debug logs exported');
  };

  const renderDebugTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Flow Debug Panel
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This panel helps diagnose issues with the profile image upload flow by testing each component systematically.
        </p>
      </div>

      {/* Debug Actions */}
      <Card>
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Debug Actions</h4>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={runComprehensiveDebugTest}
            loading={isRunningTest}
            icon={FiBug}
            variant="primary"
          >
            Run Comprehensive Test
          </Button>
          <Button
            onClick={handleClearLogs}
            icon={FiTrash}
            variant="secondary"
          >
            Clear Logs
          </Button>
          <Button
            onClick={handleExportLogs}
            icon={FiDownload}
            variant="outline"
          >
            Export Logs
          </Button>
        </div>
      </Card>

      {/* Current User Context */}
      <Card>
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">User Context Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Auth Context (user)</h5>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm font-mono">
              <div>ID: {user?.id || 'null'}</div>
              <div>Type: {typeof user?.id}</div>
              <div>Email: {user?.email || 'null'}</div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">User Context (currentUser)</h5>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm font-mono">
              <div>ID: {currentUser?.id || 'null'}</div>
              <div>user_id: {currentUser?.user_id || 'null'}</div>
              <div>Email: {currentUser?.email || 'null'}</div>
              <div>Avatar: {currentUser?.avatar_url ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">ID Consistency Check</h5>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm">
            <div className="flex items-center space-x-2">
              <SafeIcon 
                icon={user?.id === currentUser?.user_id ? FiCheckCircle : FiAlertCircle} 
                className={`w-4 h-4 ${user?.id === currentUser?.user_id ? 'text-green-500' : 'text-red-500'}`} 
              />
              <span>
                Auth ID matches User ID: {user?.id === currentUser?.user_id ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Test Results */}
      {debugResults && (
        <Card>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Test Results</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`text-2xl font-bold ${debugResults.userIds?.consistency?.bothIdsPresent ? 'text-green-600' : 'text-red-600'}`}>
                  {debugResults.userIds?.consistency?.bothIdsPresent ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">User IDs</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`text-2xl font-bold ${debugResults.database?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {debugResults.database?.success ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Database</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`text-2xl font-bold ${debugResults.storage?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {debugResults.storage?.success ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Storage</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`text-2xl font-bold ${debugResults.dbUpdate?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {debugResults.dbUpdate?.success ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">DB Update</div>
              </div>
            </div>

            {/* Detailed Results */}
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-gray-900 dark:text-white mb-2">
                View Detailed Results
              </summary>
              <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(debugResults, null, 2)}
              </pre>
            </details>
          </div>
        </Card>
      )}

      {/* Recent Debug Logs */}
      <Card>
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Recent Debug Logs</h4>
        <div className="max-h-64 overflow-y-auto">
          {getDebugLogs().slice(-10).reverse().map((log, index) => (
            <div key={index} className="text-xs font-mono p-2 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-600 dark:text-blue-400">[{log.context}]</span>
                <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-gray-700 dark:text-gray-300">{log.message}</div>
              {log.data && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-500">Data</summary>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-6">
        <div>
          <ImageUploader
            currentImageUrl={formData.avatarUrl}
            onUpload={handleAvatarUpload}
            title="Profile Picture"
            size="lg"
          />
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-500">
              <div>User ID: {user?.id}</div>
              <div>Current Avatar: {formData.avatarUrl || 'None'}</div>
              <div>Upload Loading: {uploadLoading ? 'Yes' : 'No'}</div>
              <div>Database User: {currentUser?.first_name} {currentUser?.last_name}</div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Profile Picture</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload a professional profile picture to personalize your account. JPG, PNG or GIF up to 5MB.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Position
        </label>
        <input
          type="text"
          value={formData.position}
          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Channels
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiMail} className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.email}
                onChange={(e) => handleInputChange('notifications', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiBell} className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get push notifications in browser</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.push}
                onChange={(e) => handleInputChange('notifications', 'push', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiPhone} className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified via SMS</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.sms}
                onChange={(e) => handleInputChange('notifications', 'sms', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Quiet Hours / Do Not Disturb */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quiet Hours
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiMoon} className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Do Not Disturb</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Silence notifications during specific hours</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.quietHours}
                onChange={(e) => handleInputChange('notifications', 'quietHours', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {formData.notifications.quietHours && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiClock} className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      value={formData.notifications.quietHoursStart}
                      onChange={(e) => handleInputChange('notifications', 'quietHoursStart', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiClock} className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      value={formData.notifications.quietHoursEnd}
                      onChange={(e) => handleInputChange('notifications', 'quietHoursEnd', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-yellow-500" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Allow critical alerts during quiet hours
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.allowCritical}
                    onChange={(e) => handleInputChange('notifications', 'allowCritical', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Digest Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Digest
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="digest-none"
              name="digest"
              value="none"
              checked={formData.notifications.digest === 'none'}
              onChange={() => handleInputChange('notifications', 'digest', 'none')}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="digest-none" className="text-sm font-medium text-gray-900 dark:text-white">
              No digest (receive notifications in real-time)
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="digest-daily"
              name="digest"
              value="daily"
              checked={formData.notifications.digest === 'daily'}
              onChange={() => handleInputChange('notifications', 'digest', 'daily')}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="digest-daily" className="text-sm font-medium text-gray-900 dark:text-white">
              Send daily digest (all notifications once per day)
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="digest-weekly"
              name="digest"
              value="weekly"
              checked={formData.notifications.digest === 'weekly'}
              onChange={() => handleInputChange('notifications', 'digest', 'weekly')}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="digest-weekly" className="text-sm font-medium text-gray-900 dark:text-white">
              Send weekly summary (all notifications once per week)
            </label>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Types
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiTrendingUp} className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Deal Updates</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">New deals, status changes, closing soon</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.deals}
                onChange={(e) => handleInputChange('notifications', 'deals', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiCheckSquare} className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Task Reminders</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Task assignments, due dates, overdue tasks</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.tasks}
                onChange={(e) => handleInputChange('notifications', 'tasks', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiBarChart2} className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Reports & Analytics</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Weekly reports, performance insights</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.reports}
                onChange={(e) => handleInputChange('notifications', 'reports', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={formData.preferences.theme}
            onChange={(e) => {
              handleInputChange('preferences', 'theme', e.target.value);
              if (e.target.value !== (isDark ? 'dark' : 'light')) {
                toggleTheme();
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={formData.preferences.language}
            onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={formData.preferences.currency}
            onChange={(e) => handleInputChange('preferences', 'currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={formData.preferences.timezone}
            onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <Button variant="outline">
            Update Password
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Two-Factor Authentication
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline">
              Enable 2FA
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Sessions
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chrome on MacOS • Last active: Now
              </p>
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Mobile Session</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Safari on iPhone • Last active: 2 hours ago
              </p>
            </div>
            <Button variant="outline" size="sm">
              Revoke
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reports & Analytics</h3>
        <p className="text-gray-600 dark:text-gray-400">
          View detailed reports and analytics about your sales performance, contacts, and more.
        </p>
      </div>
      <Reports />
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Management</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users, roles, and permissions for your CRM system.
        </p>
      </div>
      <Users />
    </div>
  );

  const renderPricingTab = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Plans</h3>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your subscription plan and billing information.
        </p>
      </div>
      <Pricing />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'notifications': return renderNotificationsTab();
      case 'preferences': return renderPreferencesTab();
      case 'security': return renderSecurityTab();
      case 'reports': return renderReportsTab();
      case 'users': return renderUsersTab();
      case 'pricing': return renderPricingTab();
      case 'debug': return renderDebugTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'notifications' && (
            <Button
              onClick={handleReset}
              icon={FiRefreshCw}
              variant="secondary"
              className="shadow-lg"
            >
              Reset to Defaults
            </Button>
          )}
          {(activeTab === 'profile' || activeTab === 'notifications' || activeTab === 'preferences') && (
            <Button
              onClick={handleSave}
              icon={FiSave}
              className="shadow-lg"
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <SafeIcon icon={tab.icon} className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                  {tab.id === 'debug' && process.env.NODE_ENV === 'development' && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">DEV</span>
                  )}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;