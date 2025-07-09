import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCRM } from '../context/CRMContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiArrowLeft, FiEdit2, FiMail, FiPhone, FiBuilding, FiMapPin, FiCalendar,
  FiDollarSign, FiUser, FiPlus, FiActivity, FiCheckSquare, FiTrendingUp,
  FiClock, FiMessageSquare, FiFileText, FiTarget, FiStar, FiMoreVertical,
  FiGrid, FiList, FiCheck, FiTrash2, FiX, FiSave
} = FiIcons;

const ContactDetail = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const {
    contacts, companies, deals, tasks, activities,
    updateContact, addActivity, addTask, addDeal,
    updateTask, updateDeal, updateActivity, deleteActivity,
    deleteTask, deleteDeal
  } = useCRM();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Edit states for different record types
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);

  // Separate forms for each modal
  const editForm = useForm();
  const activityForm = useForm();
  const taskForm = useForm();
  const dealForm = useForm();

  // Find the contact
  const contact = contacts.find(c => c.id === contactId);

  // Get related data with proper sorting for tasks (completed tasks at bottom)
  const contactActivities = activities.filter(activity => activity.contactId === contactId);
  const contactTasks = tasks
    .filter(task => task.contactId === contactId)
    .sort((a, b) => {
      // Completed tasks go to bottom
      if (a.status !== b.status) {
        if (a.status === 'completed') return 1;
        if (b.status === 'completed') return -1;
      }
      // Then sort by due date
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  const contactDeals = deals.filter(deal => deal.contactId === contactId);
  const contactCompany = companies.find(c => c.id === contact?.companyId);

  useEffect(() => {
    if (!contact) {
      navigate('/contacts');
    }
  }, [contact, navigate]);

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Contact edit handlers
  const handleEditContact = () => {
    editForm.reset({
      ...contact,
      firstName: contact.firstName,
      lastName: contact.lastName,
      companyId: contact.companyId
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = (data) => {
    const selectedCompany = companies.find(c => c.id === data.companyId);
    const contactData = {
      ...data,
      company: selectedCompany ? selectedCompany.name : data.company || ''
    };
    updateContact({ ...contact, ...contactData });
    toast.success('Contact updated successfully');
    setIsEditModalOpen(false);
    editForm.reset();
  };

  // Activity handlers
  const handleAddActivity = () => {
    setEditingActivity(null);
    activityForm.reset({
      type: '',
      subject: '',
      description: ''
    });
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    activityForm.reset({
      type: activity.type,
      subject: activity.subject,
      description: activity.description
    });
    setIsActivityModalOpen(true);
  };

  const handleDeleteActivity = (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      deleteActivity(activityId);
      toast.success('Activity deleted successfully');
    }
  };

  const onActivitySubmit = async (data) => {
    try {
      if (editingActivity) {
        await updateActivity({
          ...editingActivity,
          type: data.type,
          subject: data.subject,
          description: data.description,
          updatedAt: new Date().toISOString()
        });
        toast.success('Activity updated successfully');
      } else {
        await addActivity({
          type: data.type,
          subject: data.subject,
          description: data.description,
          contactId: contact.id,
          companyId: contact.companyId
        });
        toast.success('Activity added successfully');
      }
      setIsActivityModalOpen(false);
      setEditingActivity(null);
      activityForm.reset();
    } catch (error) {
      toast.error(`Failed to ${editingActivity ? 'update' : 'add'} activity`);
      console.error('Error with activity:', error);
    }
  };

  // Task handlers
  const handleAddTask = () => {
    setEditingTask(null);
    taskForm.reset({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'You'
    });
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    taskForm.reset({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
      toast.success('Task deleted successfully');
    }
  };

  const onTaskSubmit = async (data) => {
    try {
      const taskData = {
        ...data,
        dueDate: data.dueDate,
        contactId: contact.id,
        companyId: contact.companyId
      };

      if (editingTask) {
        await updateTask({
          ...editingTask,
          ...taskData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Task updated successfully');
      } else {
        await addTask(taskData);
        toast.success('Task added successfully');
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      taskForm.reset();
    } catch (error) {
      toast.error(`Failed to ${editingTask ? 'update' : 'add'} task`);
      console.error('Error with task:', error);
    }
  };

  // Deal handlers
  const handleAddDeal = () => {
    setEditingDeal(null);
    dealForm.reset({
      name: '',
      value: '',
      probability: '50',
      stage: 'lead',
      closeDate: '',
      description: ''
    });
    setIsDealModalOpen(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    dealForm.reset({
      name: deal.name,
      value: deal.value,
      probability: deal.probability,
      stage: deal.stage,
      closeDate: deal.closeDate ? format(new Date(deal.closeDate), 'yyyy-MM-dd') : '',
      description: deal.description
    });
    setIsDealModalOpen(true);
  };

  const handleDeleteDeal = (dealId) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      deleteDeal(dealId);
      toast.success('Deal deleted successfully');
    }
  };

  const onDealSubmit = async (data) => {
    try {
      const dealData = {
        ...data,
        value: parseFloat(data.value),
        probability: parseInt(data.probability),
        contactId: contact.id,
        companyId: contact.companyId,
        company: contact.company
      };

      if (editingDeal) {
        await updateDeal({
          ...editingDeal,
          ...dealData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Deal updated successfully');
      } else {
        await addDeal(dealData);
        toast.success('Deal added successfully');
      }
      setIsDealModalOpen(false);
      setEditingDeal(null);
      dealForm.reset();
    } catch (error) {
      toast.error(`Failed to ${editingDeal ? 'update' : 'add'} deal`);
      console.error('Error with deal:', error);
    }
  };

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'prospect':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'qualified':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'inactive':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'email': return FiMail;
      case 'call': return FiPhone;
      case 'meeting': return FiCalendar;
      case 'note': return FiFileText;
      default: return FiActivity;
    }
  };

  const formatDate = (date) => {
    const dateObj = new Date(date);
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'h:mm a')}`;
    } else if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, 'h:mm a')}`;
    } else {
      return format(dateObj, 'MMM d, yyyy');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiUser },
    { id: 'activities', name: 'Activities', icon: FiActivity, count: contactActivities.length },
    { id: 'tasks', name: 'Tasks', icon: FiCheckSquare, count: contactTasks.length },
    { id: 'deals', name: 'Deals', icon: FiTrendingUp, count: contactDeals.length },
  ];

  // Enhanced Grid and List view components with fixed action button positioning
  const ActivityGridView = ({ activities }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activities.map((activity) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg group"
        >
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <SafeIcon icon={getActivityIcon(activity.type)} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {activity.subject}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(activity.createdAt)}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {activity.description}
              </p>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs bg-primary-100 text-primary-600 rounded-full">
                  {activity.type}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action buttons on their own line */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => handleEditActivity(activity)}
              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              title="Edit Activity"
            >
              <SafeIcon icon={FiEdit2} className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteActivity(activity.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              title="Delete Activity"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const ActivityListView = ({ activities }) => (
    <Card padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th scope="col" className="px-6 py-3">Type</th>
              <th scope="col" className="px-6 py-3">Subject</th>
              <th scope="col" className="px-6 py-3">Description</th>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr
                key={activity.id}
                className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <SafeIcon icon={getActivityIcon(activity.type)} className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {activity.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {activity.subject}
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                  {activity.description}
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {formatDate(activity.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditActivity(activity)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit Activity"
                    >
                      <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Delete Activity"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activities.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiActivity} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No activities recorded</p>
        </div>
      )}
    </Card>
  );

  const TaskGridView = ({ tasks }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tasks.map((task) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg group"
        >
          <div className="flex items-start space-x-3 mb-4">
            <button
              onClick={() => {
                updateTask({ ...task, status: task.status === 'completed' ? 'pending' : 'completed' });
                toast.success(`Task marked as ${task.status === 'completed' ? 'pending' : 'completed'}`);
              }}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
              }`}
            >
              {task.status === 'completed' && (
                <SafeIcon icon={FiCheck} className="w-3 h-3" />
              )}
            </button>
            <div className="flex-1">
              <h4 className={`font-medium mb-1 ${
                task.status === 'completed'
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {task.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {task.description}
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action buttons on their own line */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => handleEditTask(task)}
              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              title="Edit Task"
            >
              <SafeIcon icon={FiEdit2} className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              title="Delete Task"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const TaskListView = ({ tasks }) => (
    <Card padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Title</th>
              <th scope="col" className="px-6 py-3">Priority</th>
              <th scope="col" className="px-6 py-3">Due Date</th>
              <th scope="col" className="px-6 py-3">Assigned To</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isPastDue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
              return (
                <tr
                  key={task.id}
                  className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        updateTask({ ...task, status: task.status === 'completed' ? 'pending' : 'completed' });
                        toast.success(`Task marked as ${task.status === 'completed' ? 'pending' : 'completed'}`);
                      }}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <SafeIcon icon={FiCheck} className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className={`px-6 py-4 font-medium ${
                    task.status === 'completed'
                      ? 'line-through text-gray-500 dark:text-gray-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {task.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${
                      isPastDue ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      {isPastDue && ' (Overdue)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {task.assignedTo}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Edit Task"
                      >
                        <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Delete Task"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiCheckSquare} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No tasks assigned</p>
        </div>
      )}
    </Card>
  );

  const DealGridView = ({ deals }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {deals.map((deal) => (
        <motion.div
          key={deal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg group"
        >
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {deal.name}
              </h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                deal.stage === 'closed-won'
                  ? 'bg-green-100 text-green-600'
                  : deal.stage === 'closed-lost'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {deal.stage}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Value:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${deal.value.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Probability:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {deal.probability}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Close Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(deal.closeDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            {deal.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                {deal.description}
              </p>
            )}
          </div>
          
          {/* Action buttons on their own line */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => handleEditDeal(deal)}
              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              title="Edit Deal"
            >
              <SafeIcon icon={FiEdit2} className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteDeal(deal.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              title="Delete Deal"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const DealListView = ({ deals }) => (
    <Card padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th scope="col" className="px-6 py-3">Deal Name</th>
              <th scope="col" className="px-6 py-3">Stage</th>
              <th scope="col" className="px-6 py-3">Value</th>
              <th scope="col" className="px-6 py-3">Probability</th>
              <th scope="col" className="px-6 py-3">Close Date</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr
                key={deal.id}
                className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {deal.name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    deal.stage === 'closed-won'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : deal.stage === 'closed-lost'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {deal.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  ${deal.value.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        deal.probability >= 70
                          ? 'bg-green-500'
                          : deal.probability >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${deal.probability}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                    {deal.probability}%
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {format(new Date(deal.closeDate), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditDeal(deal)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit Deal"
                    >
                      <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDeal(deal.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Delete Deal"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deals.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiTrendingUp} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No deals associated</p>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/contacts')}
            icon={FiArrowLeft}
          >
            Back to Contacts
          </Button>
        </div>
        <Button
          onClick={handleEditContact}
          icon={FiEdit2}
          variant="outline"
        >
          Edit Contact
        </Button>
      </div>

      {/* Contact Header Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {contact.firstName?.[0]}{contact.lastName?.[0]}
              </span>
            </div>

            {/* Contact Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {contact.firstName} {contact.lastName}
                </h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(contact.status)}`}>
                  {contact.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
                {contact.position && (
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiUser} className="w-4 h-4" />
                    <span>{contact.position}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiBuilding} className="w-4 h-4" />
                  <span>{contact.company}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMail} className="w-4 h-4" />
                  <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-700">
                    {contact.email}
                  </a>
                </div>
                {contact.phone && (
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiPhone} className="w-4 h-4" />
                    <a href={`tel:${contact.phone}`} className="text-primary-600 hover:text-primary-700">
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {contactDeals.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Deals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {contactTasks.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${contactDeals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Value</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card padding={false}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SafeIcon icon={tab.icon} className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <span className="text-gray-900 dark:text-white">{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                        <span className="text-gray-900 dark:text-white">{contact.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Company:</span>
                      <span className="text-gray-900 dark:text-white">{contact.company}</span>
                    </div>
                    {contact.position && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Position:</span>
                        <span className="text-gray-900 dark:text-white">{contact.position}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Source:</span>
                      <span className="text-gray-900 dark:text-white">{contact.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Added:</span>
                      <span className="text-gray-900 dark:text-white">
                        {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                {contactCompany && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Company Details
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <SafeIcon icon={FiBuilding} className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {contactCompany.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {contactCompany.industry}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {contactCompany.website && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Website:</span>
                            <a
                              href={contactCompany.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {contactCompany.website}
                            </a>
                          </div>
                        )}
                        {contactCompany.size && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Size:</span>
                            <span className="text-gray-900 dark:text-white">{contactCompany.size}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <Button
                    size="sm"
                    onClick={handleAddActivity}
                    icon={FiPlus}
                  >
                    Add Activity
                  </Button>
                </div>
                <div className="space-y-4">
                  {contactActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <SafeIcon icon={getActivityIcon(activity.type)} className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.subject}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {contactActivities.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No activities yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  All Activities
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      title="Grid View"
                    >
                      <SafeIcon icon={FiGrid} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      title="List View"
                    >
                      <SafeIcon icon={FiList} className="w-4 h-4" />
                    </button>
                  </div>
                  <Button onClick={handleAddActivity} icon={FiPlus}>
                    Add Activity
                  </Button>
                </div>
              </div>
              {viewMode === 'grid' ? (
                <ActivityGridView activities={contactActivities} />
              ) : (
                <ActivityListView activities={contactActivities} />
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contact Tasks
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      title="Grid View"
                    >
                      <SafeIcon icon={FiGrid} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      title="List View"
                    >
                      <SafeIcon icon={FiList} className="w-4 h-4" />
                    </button>
                  </div>
                  <Button onClick={handleAddTask} icon={FiPlus}>
                    Add Task
                  </Button>
                </div>
              </div>
              {viewMode === 'grid' ? (
                <TaskGridView tasks={contactTasks} />
              ) : (
                <TaskListView tasks={contactTasks} />
              )}
            </div>
          )}

          {/* Deals Tab */}
          {activeTab === 'deals' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contact Deals
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      title="Grid View"
                    >
                      <SafeIcon icon={FiGrid} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      title="List View"
                    >
                      <SafeIcon icon={FiList} className="w-4 h-4" />
                    </button>
                  </div>
                  <Button onClick={handleAddDeal} icon={FiPlus}>
                    Add Deal
                  </Button>
                </div>
              </div>
              {viewMode === 'grid' ? (
                <DealGridView deals={contactDeals} />
              ) : (
                <DealListView deals={contactDeals} />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Edit Contact Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contact"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                {...editForm.register('firstName', { required: 'First name is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {editForm.formState.errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                {...editForm.register('lastName', { required: 'Last name is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {editForm.formState.errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              {...editForm.register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {editForm.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                {...editForm.register('phone')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <select
                {...editForm.register('companyId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position
              </label>
              <input
                {...editForm.register('position')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                {...editForm.register('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update Contact
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={editingActivity ? 'Edit Activity' : 'Add Activity'}
      >
        <form onSubmit={activityForm.handleSubmit(onActivitySubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity Type
            </label>
            <select
              {...activityForm.register('type', { required: 'Activity type is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select type</option>
              <option value="email">Email</option>
              <option value="call">Phone Call</option>
              <option value="meeting">Meeting</option>
              <option value="note">Note</option>
            </select>
            {activityForm.formState.errors.type && (
              <p className="text-red-500 text-xs mt-1">{activityForm.formState.errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              {...activityForm.register('subject', { required: 'Subject is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {activityForm.formState.errors.subject && (
              <p className="text-red-500 text-xs mt-1">{activityForm.formState.errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...activityForm.register('description')}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsActivityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingActivity ? 'Update Activity' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Task'}
      >
        <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title
            </label>
            <input
              {...taskForm.register('title', { required: 'Task title is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {taskForm.formState.errors.title && (
              <p className="text-red-500 text-xs mt-1">{taskForm.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...taskForm.register('description')}
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
                {...taskForm.register('dueDate', { required: 'Due date is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {taskForm.formState.errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">{taskForm.formState.errors.dueDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                {...taskForm.register('priority')}
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
                {...taskForm.register('status')}
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
                {...taskForm.register('assignedTo')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingTask ? 'Update Task' : 'Add Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Deal Modal */}
      <Modal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        title={editingDeal ? 'Edit Deal' : 'Add Deal'}
      >
        <form onSubmit={dealForm.handleSubmit(onDealSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Name
            </label>
            <input
              {...dealForm.register('name', { required: 'Deal name is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {dealForm.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{dealForm.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Value
              </label>
              <input
                type="number"
                {...dealForm.register('value', { required: 'Value is required', min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {dealForm.formState.errors.value && (
                <p className="text-red-500 text-xs mt-1">{dealForm.formState.errors.value.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                {...dealForm.register('probability', {
                  required: 'Probability is required',
                  min: 0,
                  max: 100
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {dealForm.formState.errors.probability && (
                <p className="text-red-500 text-xs mt-1">{dealForm.formState.errors.probability.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stage
              </label>
              <select
                {...dealForm.register('stage')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                {...dealForm.register('closeDate', { required: 'Close date is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {dealForm.formState.errors.closeDate && (
                <p className="text-red-500 text-xs mt-1">{dealForm.formState.errors.closeDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...dealForm.register('description')}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDealModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingDeal ? 'Update Deal' : 'Add Deal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContactDetail;