import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { format, formatDistanceToNow } from 'date-fns';
import SafeIcon from '../../common/SafeIcon';
import Button from './Button';
import * as FiIcons from 'react-icons/fi';

const {
  FiX, FiBell, FiCheck, FiTrash2, FiExternalLink, FiFilter,
  FiCheckSquare, FiTrendingUp, FiBarChart3, FiSettings, FiAlertTriangle,
  FiInfo, FiRefreshCw
} = FiIcons;

const NotificationsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    userPreferences
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // all, unread, tasks, deals, system, reports
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, priority

  if (!isOpen) return null;

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else if (sortBy === 'oldest') {
      return new Date(a.timestamp) - new Date(b.timestamp);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task': return FiCheckSquare;
      case 'deal': return FiTrendingUp;
      case 'report': return FiBarChart3;
      case 'system': return FiSettings;
      default: return FiBell;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'task': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'deal': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'report': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'system': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      onClose();
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  // Check if notification type is enabled in the user's preferences
  const isNotificationTypeEnabled = (type) => {
    if (type === 'task' && !userPreferences.tasks) return false;
    if (type === 'deal' && !userPreferences.deals) return false;
    if (type === 'report' && !userPreferences.reports) return false;
    return true; // System notifications are always shown
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <SafeIcon icon={FiBell} className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filters and Actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="unread">Unread Only</option>
                    <option value="task">Tasks</option>
                    <option value="deal">Deals</option>
                    <option value="system">System</option>
                    <option value="report">Reports</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority">By Priority</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={markAllAsRead}
                      icon={FiCheck}
                    >
                      Mark All Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllNotifications}
                    icon={FiTrash2}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {sortedNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <SafeIcon icon={FiBell} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "You don't have any notifications yet."
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedNotifications.map((notification, index) => (
                    // Skip rendering if notification type is disabled in preferences
                    isNotificationTypeEnabled(notification.type) && (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Unread indicator */}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          )}

                          {/* Icon */}
                          <div className={`p-2 rounded-lg flex-shrink-0 ${getTypeColor(notification.type)}`}>
                            <SafeIcon
                              icon={getNotificationIcon(notification.type)}
                              className="w-4 h-4"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className={`text-sm font-medium ${
                                    !notification.read 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                  </p>
                                  {notification.actionUrl && (
                                    <SafeIcon icon={FiExternalLink} className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(e, notification.id)}
                                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Mark as read"
                                  >
                                    <SafeIcon icon={FiCheck} className="w-3 h-3 text-gray-500" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDelete(e, notification.id)}
                                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="Delete notification"
                                >
                                  <SafeIcon icon={FiTrash2} className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Showing {sortedNotifications.length} of {notifications.length} notifications
                </span>
                <button
                  onClick={onClose}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Close
                </button>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
                <p>
                  You can manage your notification preferences in 
                  <button 
                    onClick={() => {
                      onClose();
                      navigate('/settings?tab=notifications');
                    }}
                    className="ml-1 text-primary-600 hover:text-primary-700"
                  >
                    settings
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default NotificationsModal;