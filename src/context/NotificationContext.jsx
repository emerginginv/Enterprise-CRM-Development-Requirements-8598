import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCRM } from './CRMContext';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { tasks, deals, contacts } = useCRM();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // User preferences for notifications - retrieved from localStorage
  const [userPreferences, setUserPreferences] = useState(() => {
    const savedPrefs = localStorage.getItem('notification-preferences');
    return savedPrefs ? JSON.parse(savedPrefs) : {
      // Default notification settings
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
  });

  // Update localStorage when preferences change
  useEffect(() => {
    localStorage.setItem('notification-preferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Public method to update preferences
  const updatePreferences = (newPreferences) => {
    setUserPreferences(prevPrefs => {
      const updatedPrefs = { ...prevPrefs, ...newPreferences };
      localStorage.setItem('notification-preferences', JSON.stringify(updatedPrefs));
      return updatedPrefs;
    });
  };

  // Check if a notification type is enabled in user preferences
  const isNotificationTypeEnabled = (type) => {
    if (type === 'deal' || type === 'deals') return userPreferences.deals;
    if (type === 'task' || type === 'tasks') return userPreferences.tasks;
    if (type === 'report' || type === 'reports') return userPreferences.reports;
    // System notifications are always enabled
    if (type === 'system') return true;
    return true; // Default to enabled for unknown types
  };

  // Check if notification should be shown based on quiet hours
  const shouldShowNotification = (priority) => {
    if (!userPreferences.quietHours) return true;
    
    // Check if current time is within quiet hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = userPreferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = userPreferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    const isQuietTime = startTime > endTime
      ? (currentTime >= startTime || currentTime <= endTime)
      : (currentTime >= startTime && currentTime <= endTime);
    
    // Allow critical notifications during quiet hours if enabled
    if (isQuietTime && priority === 'high' && userPreferences.allowCritical) {
      return true;
    }
    
    return !isQuietTime;
  };

  // Generate notifications based on CRM data and user preferences
  useEffect(() => {
    if (!user) return;

    const generateNotifications = () => {
      const newNotifications = [];
      const now = new Date();

      // Only generate notifications for enabled types
      
      // Task-based notifications
      if (isNotificationTypeEnabled('task')) {
        tasks.forEach(task => {
          const dueDate = new Date(task.dueDate);
          const timeDiff = dueDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Overdue tasks
          if (daysDiff < 0 && task.status === 'pending') {
            newNotifications.push({
              id: `task-overdue-${task.id}`,
              type: 'task',
              priority: 'high',
              title: 'Task Overdue',
              message: `Task "${task.title}" is ${Math.abs(daysDiff)} day(s) overdue`,
              timestamp: new Date(now.getTime() - Math.abs(daysDiff) * 24 * 60 * 60 * 1000),
              read: false,
              actionUrl: `/contacts/${task.contactId}?tab=tasks`,
              relatedId: task.id
            });
          }
          // Tasks due today
          else if (daysDiff === 0 && task.status === 'pending') {
            newNotifications.push({
              id: `task-due-today-${task.id}`,
              type: 'task',
              priority: 'medium',
              title: 'Task Due Today',
              message: `Task "${task.title}" is due today`,
              timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
              read: false,
              actionUrl: `/contacts/${task.contactId}?tab=tasks`,
              relatedId: task.id
            });
          }
          // Tasks due tomorrow
          else if (daysDiff === 1 && task.status === 'pending') {
            newNotifications.push({
              id: `task-due-tomorrow-${task.id}`,
              type: 'task',
              priority: 'low',
              title: 'Task Due Tomorrow',
              message: `Task "${task.title}" is due tomorrow`,
              timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
              read: false,
              actionUrl: `/contacts/${task.contactId}?tab=tasks`,
              relatedId: task.id
            });
          }
        });
      }

      // Deal-based notifications
      if (isNotificationTypeEnabled('deal')) {
        deals.forEach(deal => {
          const closeDate = new Date(deal.closeDate);
          const timeDiff = closeDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Deals closing soon
          if (daysDiff <= 7 && daysDiff >= 0 && deal.stage !== 'closed-won' && deal.stage !== 'closed-lost') {
            newNotifications.push({
              id: `deal-closing-${deal.id}`,
              type: 'deal',
              priority: daysDiff <= 3 ? 'high' : 'medium',
              title: 'Deal Closing Soon',
              message: `Deal "${deal.name}" closes in ${daysDiff} day(s) - ${deal.probability}% probability`,
              timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
              read: false,
              actionUrl: `/deals`,
              relatedId: deal.id
            });
          }

          // High-value deals
          if (deal.value >= 50000 && deal.stage === 'proposal') {
            newNotifications.push({
              id: `deal-high-value-${deal.id}`,
              type: 'deal',
              priority: 'high',
              title: 'High-Value Deal in Proposal',
              message: `High-value deal "${deal.name}" ($${deal.value.toLocaleString()}) is in proposal stage`,
              timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
              read: false,
              actionUrl: `/deals`,
              relatedId: deal.id
            });
          }
        });
      }

      // System notifications
      newNotifications.push({
        id: 'system-welcome',
        type: 'system',
        priority: 'low',
        title: 'Welcome to CRM Pro',
        message: 'Your CRM system is ready. Start by adding contacts and deals to track your sales pipeline.',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        read: false,
        actionUrl: '/contacts'
      });

      // Weekly report notification
      if (isNotificationTypeEnabled('report') && now.getDay() === 1) { // Monday
        newNotifications.push({
          id: 'weekly-report',
          type: 'report',
          priority: 'low',
          title: 'Weekly Report Available',
          message: 'Your weekly sales report is ready. Review your performance and plan for the week ahead.',
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
          read: false,
          actionUrl: '/reports'
        });
      }

      // Filter notifications based on quiet hours
      const filteredNotifications = newNotifications.filter(notification => 
        shouldShowNotification(notification.priority)
      );

      // Sort by timestamp (newest first)
      filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return filteredNotifications;
    };

    const generatedNotifications = generateNotifications();
    
    // Preserve read status for existing notifications
    const mergedNotifications = generatedNotifications.map(newNotification => {
      const existingNotification = notifications.find(n => n.id === newNotification.id);
      return existingNotification 
        ? { ...newNotification, read: existingNotification.read } 
        : newNotification;
    });
    
    setNotifications(mergedNotifications);
    
    // Calculate unread count
    const unread = mergedNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [user, tasks, deals, contacts, userPreferences]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);
      
      // Update unread count if the deleted notification was unread
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return newNotifications;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  // Get notifications by priority
  const getNotificationsByPriority = (priority) => {
    return notifications.filter(notification => notification.priority === priority);
  };

  const value = {
    notifications,
    unreadCount,
    userPreferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    getNotificationsByPriority
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};