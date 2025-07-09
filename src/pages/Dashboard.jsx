import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { format, isToday, isYesterday, isTomorrow, isPast } from 'date-fns';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiUsers, FiTrendingUp, FiCheckSquare, FiDollarSign, FiArrowUp, FiArrowDown,
  FiPhone, FiMail, FiCalendar, FiClock, FiMessageSquare, FiFileText,
  FiInfo, FiAlertTriangle, FiCoffee, FiClipboard, FiExternalLink, FiStar, FiUser
} = FiIcons;

const Dashboard = () => {
  const navigate = useNavigate();
  const { contacts, deals, tasks, activities, companies } = useCRM();

  // Calculate metrics
  const totalRevenue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const activeDeals = deals.filter(deal => deal.stage !== 'closed-won' && deal.stage !== 'closed-lost').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const recentActivities = activities.slice(0, 8);

  // Get upcoming tasks, sorted by due date, with overdue tasks first
  const upcomingTasks = tasks
    .filter(task => task.status === 'pending')
    .sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      const aIsOverdue = isPast(dateA) && !isToday(dateA);
      const bIsOverdue = isPast(dateB) && !isToday(dateB);

      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      return dateA - dateB;
    })
    .slice(0, 5);

  const stats = [
    {
      name: 'Total Contacts',
      value: contacts.length,
      icon: FiUsers,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Active Deals',
      value: activeDeals,
      icon: FiTrendingUp,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Pending Tasks',
      value: pendingTasks,
      icon: FiCheckSquare,
      color: 'bg-yellow-500',
      change: '-3%',
      changeType: 'negative'
    },
    {
      name: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'email': return FiMail;
      case 'call': return FiPhone;
      case 'meeting': return FiCalendar;
      case 'note': return FiFileText;
      case 'task': return FiCheckSquare;
      case 'deal': return FiTrendingUp;
      case 'company': return FiUsers;
      case 'contact': return FiUsers;
      default: return FiMessageSquare;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'call': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'meeting': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'note': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      case 'task': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'deal': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'company': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400';
      case 'contact': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatDate = (date) => {
    const dateObj = new Date(date);
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'h:mm a')}`;
    } else if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, 'h:mm a')}`;
    } else if (isTomorrow(dateObj)) {
      return `Tomorrow at ${format(dateObj, 'h:mm a')}`;
    } else {
      return format(dateObj, 'MMM d, yyyy');
    }
  };

  const formatDueDate = (date) => {
    const dateObj = new Date(date);
    const isPastDue = isPast(dateObj) && !isToday(dateObj);

    let dateText;
    if (isToday(dateObj)) {
      dateText = 'Today';
    } else if (isYesterday(dateObj)) {
      dateText = 'Yesterday';
    } else if (isTomorrow(dateObj)) {
      dateText = 'Tomorrow';
    } else {
      dateText = format(dateObj, 'MMM d, yyyy');
    }

    return { text: dateText, isPastDue };
  };

  const getTaskStatusIndicator = (task) => {
    const dueDate = new Date(task.dueDate);
    const isPastDue = isPast(dueDate) && !isToday(dueDate);

    if (isPastDue) {
      return (
        <div className="flex items-center space-x-1 text-red-600">
          <SafeIcon icon={FiAlertTriangle} className="w-4 h-4" />
          <span>Overdue</span>
        </div>
      );
    } else if (isToday(dueDate)) {
      return (
        <div className="flex items-center space-x-1 text-yellow-600">
          <SafeIcon icon={FiClock} className="w-4 h-4" />
          <span>Today</span>
        </div>
      );
    } else if (isTomorrow(dueDate)) {
      return (
        <div className="flex items-center space-x-1 text-blue-600">
          <SafeIcon icon={FiCalendar} className="w-4 h-4" />
          <span>Tomorrow</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1 text-green-600">
          <SafeIcon icon={FiCalendar} className="w-4 h-4" />
          <span>{format(dueDate, 'MMM d')}</span>
        </div>
      );
    }
  };

  // Get related entity info for activities
  const getRelatedEntityInfo = (activity) => {
    if (activity.contactId) {
      const contact = contacts.find(c => c.id === activity.contactId);
      if (contact) {
        return { name: `${contact.firstName} ${contact.lastName}`, type: 'contact' };
      }
    }

    if (activity.companyId) {
      const company = companies.find(c => c.id === activity.companyId);
      if (company) {
        return { name: company.name, type: 'company' };
      }
    }

    return null;
  };

  const handleViewAllTasks = () => {
    navigate('/tasks');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-1">
                    <SafeIcon 
                      icon={stat.changeType === 'positive' ? FiArrowUp : FiArrowDown} 
                      className={`w-4 h-4 ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`} 
                    />
                    <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <SafeIcon icon={stat.icon} className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiClipboard} className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activities
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const relatedEntity = getRelatedEntityInfo(activity);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        <SafeIcon icon={getActivityIcon(activity.type)} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.subject}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(activity.createdAt)}
                          </p>
                          {relatedEntity && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                              {relatedEntity.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <SafeIcon icon={FiInfo} className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiCheckSquare} className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upcoming Tasks
                </h3>
              </div>
              <Button size="sm" variant="outline" icon={FiExternalLink} onClick={handleViewAllTasks}>
                View all
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => {
                  const dueDate = formatDueDate(task.dueDate);
                  return (
                    <div key={task.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)} flex items-center justify-center`}>
                            <SafeIcon icon={FiStar} className="w-3 h-3" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {task.description}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-3 text-xs">
                        <div className="flex space-x-2">
                          {getTaskStatusIndicator(task)}
                          <span className="text-gray-500 dark:text-gray-400">
                            {task.assignedTo}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.contactId && (
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiUser} className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-500 dark:text-gray-400">
                                {contacts.find(c => c.id === task.contactId)?.firstName || ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <SafeIcon icon={FiCoffee} className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No upcoming tasks</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiDollarSign} className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sales Summary
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Deal Stages */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Deal Stages</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Leads</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {deals.filter(d => d.stage === 'lead').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Qualified</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {deals.filter(d => d.stage === 'qualified').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Proposal</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {deals.filter(d => d.stage === 'proposal').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Negotiation</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {deals.filter(d => d.stage === 'negotiation').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Closed Won</span>
                  <span className="text-sm font-medium text-green-600">
                    {deals.filter(d => d.stage === 'closed-won').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Closed Lost</span>
                  <span className="text-sm font-medium text-red-600">
                    {deals.filter(d => d.stage === 'closed-lost').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Deals */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 col-span-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Top Deals</h4>
              <div className="space-y-3">
                {deals
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)
                  .map(deal => (
                    <div key={deal.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">{deal.name}</h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{deal.company}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            deal.stage === 'closed-won' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : deal.stage === 'closed-lost' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {deal.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">${deal.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{deal.probability}% probability</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;