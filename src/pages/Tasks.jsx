import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCRM } from '../context/CRMContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay } from 'date-fns';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiClock, FiUser, FiCalendar,
  FiFilter, FiSearch, FiChevronDown, FiChevronRight, FiX, FiRefreshCw
} = FiIcons;

const Tasks = () => {
  const { tasks, contacts, deals, addTask, updateTask, deleteTask } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all', // all, pending, completed, overdue
    dueDate: 'all', // all, today, this_week, this_month, overdue
    priority: 'all', // all, high, medium, low
    assignedTo: 'all', // all, specific person
    relatedDeal: 'all', // all, specific deal
    relatedContact: 'all' // all, specific contact
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Get unique values for filter dropdowns
  const uniqueAssignees = [...new Set(tasks.map(task => task.assignedTo).filter(Boolean))];

  // Enhanced filtering function
  const getFilteredTasks = () => {
    let filtered = tasks.filter(task => {
      // Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (filters.status === 'pending') {
        matchesStatus = task.status === 'pending';
      } else if (filters.status === 'completed') {
        matchesStatus = task.status === 'completed';
      } else if (filters.status === 'overdue') {
        matchesStatus = new Date(task.dueDate) < new Date() && task.status === 'pending';
      }

      // Due date filter
      let matchesDueDate = true;
      if (filters.dueDate === 'today') {
        matchesDueDate = isToday(new Date(task.dueDate));
      } else if (filters.dueDate === 'this_week') {
        matchesDueDate = isThisWeek(new Date(task.dueDate));
      } else if (filters.dueDate === 'this_month') {
        matchesDueDate = isThisMonth(new Date(task.dueDate));
      } else if (filters.dueDate === 'overdue') {
        matchesDueDate = new Date(task.dueDate) < new Date() && task.status === 'pending';
      }

      // Priority filter
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;

      // Assigned to filter
      const matchesAssignedTo = filters.assignedTo === 'all' || task.assignedTo === filters.assignedTo;

      // Related deal filter
      const matchesRelatedDeal = filters.relatedDeal === 'all' || task.dealId === filters.relatedDeal;

      // Related contact filter
      const matchesRelatedContact = filters.relatedContact === 'all' || task.contactId === filters.relatedContact;

      return matchesSearch && matchesStatus && matchesDueDate && matchesPriority && 
             matchesAssignedTo && matchesRelatedDeal && matchesRelatedContact;
    });

    // Sort tasks: completed tasks go to bottom, then by due date
    return filtered.sort((a, b) => {
      // First sort by completion status (pending first)
      if (a.status !== b.status) {
        if (a.status === 'completed') return 1;
        if (b.status === 'completed') return -1;
      }
      
      // Then sort by due date (earliest first for pending tasks)
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      
      // For pending tasks, show overdue first, then by date
      if (a.status === 'pending' && b.status === 'pending') {
        const aIsOverdue = dateA < new Date();
        const bIsOverdue = dateB < new Date();
        
        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;
        
        return dateA - dateB;
      }
      
      // For completed tasks, sort by completion date (most recent first)
      return dateA - dateB;
    });
  };

  const filteredTasks = getFilteredTasks();

  const handleAddTask = () => {
    setEditingTask(null);
    reset();
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    reset(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
      toast.success('Task deleted successfully');
    }
  };

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask({ ...task, status: newStatus });
    toast.success(`Task marked as ${newStatus}`);
  };

  const toggleTaskExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const onSubmit = (data) => {
    const taskData = {
      ...data,
      dueDate: new Date(data.dueDate).toISOString(),
    };

    if (editingTask) {
      updateTask({ ...editingTask, ...taskData });
      toast.success('Task updated successfully');
    } else {
      addTask(taskData);
      toast.success('Task added successfully');
    }
    setIsModalOpen(false);
    reset();
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      dueDate: 'all',
      priority: 'all',
      assignedTo: 'all',
      relatedDeal: 'all',
      relatedContact: 'all'
    });
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    const activeFilters = Object.values(filters).filter(value => value !== 'all').length;
    return searchTerm ? activeFilters + 1 : activeFilters;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'pending':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status === 'pending';
  };

  // Get task statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => isOverdue(t.dueDate, t.status)).length,
    dueToday: tasks.filter(t => isToday(new Date(t.dueDate)) && t.status === 'pending').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your tasks and activities
          </p>
        </div>
        <Button onClick={handleAddTask} icon={FiPlus} className="shadow-lg">
          Add Task
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{taskStats.pending}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overdue</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">{taskStats.dueToday}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Due Today</div>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <select
                value={filters.dueDate}
                onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Due Today</option>
                <option value="this_week">Due This Week</option>
                <option value="this_month">Due This Month</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assigned To Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assigned To
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Assignees</option>
                {uniqueAssignees.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>
            </div>

            {/* Related Contact Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related Contact
              </label>
              <select
                value={filters.relatedContact}
                onChange={(e) => handleFilterChange('relatedContact', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Contacts</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Related Deal Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related Deal
              </label>
              <select
                value={filters.relatedDeal}
                onChange={(e) => handleFilterChange('relatedDeal', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Deals</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters and Clear Button */}
          {getActiveFilterCount() > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiFilter} className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                icon={FiRefreshCw}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredTasks.length} of {tasks.length} tasks
        </span>
        {filteredTasks.length !== tasks.length && (
          <span className="text-primary-600 dark:text-primary-400">
            Filtered results
          </span>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <SafeIcon icon={FiClock} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {getActiveFilterCount() > 0 
                  ? "Try adjusting your filters or search criteria"
                  : "Create your first task to get started"
                }
              </p>
              {getActiveFilterCount() > 0 ? (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={handleAddTask} icon={FiPlus}>
                  Add Task
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredTasks.map((task, index) => {
            const isExpanded = expandedTasks.has(task.id);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  hover
                  className={`${
                    task.status === 'completed' ? 'opacity-60' : ''
                  } transition-all duration-200`}
                  padding={false}
                >
                  {/* Collapsed View - Always visible */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === 'completed'
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                          }`}
                        >
                          {task.status === 'completed' && (
                            <SafeIcon icon={FiCheck} className="w-3 h-3" />
                          )}
                        </button>

                        {/* Expand/Collapse Button */}
                        <button
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <SafeIcon
                            icon={isExpanded ? FiChevronDown : FiChevronRight}
                            className="w-4 h-4 text-gray-500"
                          />
                        </button>

                        {/* Task Title and Basic Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3
                              className={`font-medium truncate ${
                                task.status === 'completed'
                                  ? 'line-through text-gray-500 dark:text-gray-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {task.title}
                            </h3>
                            <span
                              className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          {/* Compact info row */}
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiCalendar} className="w-3 h-3" />
                              <span
                                className={
                                  isOverdue(task.dueDate, task.status) ? 'text-red-600' : ''
                                }
                              >
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <SafeIcon icon={FiUser} className="w-3 h-3" />
                              <span>{task.assignedTo}</span>
                            </div>
                            {isOverdue(task.dueDate, task.status) && (
                              <div className="flex items-center space-x-1 text-red-600">
                                <SafeIcon icon={FiClock} className="w-3 h-3" />
                                <span>Overdue</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded View - Conditionally visible */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-3 pt-2 space-y-3">
                          {/* Description */}
                          {task.description && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {task.description}
                              </p>
                            </div>
                          )}

                          {/* Detailed Info Grid */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                              <div className="flex items-center space-x-1 mt-1">
                                <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-400" />
                                <span
                                  className={`${
                                    isOverdue(task.dueDate, task.status)
                                      ? 'text-red-600 font-medium'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Status:</span>
                              <div className="mt-1">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                    task.status
                                  )}`}
                                >
                                  {task.status}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Assigned To:</span>
                              <div className="flex items-center space-x-1 mt-1">
                                <SafeIcon icon={FiUser} className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900 dark:text-white">{task.assignedTo}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                              <div className="mt-1">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Related Items */}
                          {(task.contactId || task.dealId) && (
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Related
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {task.contactId && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                    Contact: {contacts.find((c) => c.id === task.contactId)?.firstName}{' '}
                                    {contacts.find((c) => c.id === task.contactId)?.lastName}
                                  </span>
                                )}
                                {task.dealId && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                                    Deal: {deals.find((d) => d.id === task.dealId)?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title
            </label>
            <input
              {...register('title', { required: 'Task title is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assigned To
              </label>
              <input
                {...register('assignedTo')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related Contact
              </label>
              <select
                {...register('contactId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Related Deal
              </label>
              <select
                {...register('dealId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a deal</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingTask ? 'Update Task' : 'Add Task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;