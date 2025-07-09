import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCRM } from '../context/CRMContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format, parseISO, differenceInDays } from 'date-fns';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiArrowLeft, FiEdit2, FiTrash2, FiDollarSign, FiCalendar, 
  FiUser, FiBuilding, FiPieChart, FiCheck, FiX, FiClock,
  FiActivity, FiMessageSquare, FiFileText, FiMail, FiPhone,
  FiPlus, FiCheckSquare, FiInfo, FiAlertTriangle, FiGlobe
} = FiIcons;

const DEAL_STAGES = [
  { id: 'lead', name: 'Lead', color: 'from-gray-400 to-gray-500' },
  { id: 'qualified', name: 'Qualified', color: 'from-blue-400 to-blue-500' },
  { id: 'proposal', name: 'Proposal', color: 'from-yellow-400 to-yellow-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'from-orange-400 to-orange-500' },
  { id: 'closed-won', name: 'Closed Won', color: 'from-green-400 to-green-500' },
  { id: 'closed-lost', name: 'Closed Lost', color: 'from-red-400 to-red-500' },
];

const DealDetail = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { 
    deals, contacts, companies, activities, tasks,
    updateDeal, deleteDeal, addActivity, addTask, updateTask
  } = useCRM();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const dealForm = useForm();
  const activityForm = useForm();
  const taskForm = useForm();

  // Find the deal
  const deal = deals.find(d => d.id === dealId);
  
  // Get related data
  const relatedContact = contacts.find(c => c.id === deal?.contactId);
  const relatedCompany = companies.find(c => c.id === deal?.companyId);
  const dealActivities = activities.filter(a => 
    a.dealId === dealId || 
    (deal?.contactId && a.contactId === deal.contactId)
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const dealTasks = tasks.filter(t => t.dealId === dealId)
    .sort((a, b) => {
      // Completed tasks at bottom
      if (a.status !== b.status) {
        if (a.status === 'completed') return 1;
        if (b.status === 'completed') return -1;
      }
      // Then sort by due date
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  useEffect(() => {
    if (!deal) {
      navigate('/deals');
    } else {
      // Pre-populate the edit form
      dealForm.reset({
        name: deal.name,
        value: deal.value,
        probability: deal.probability,
        stage: deal.stage,
        contactId: deal.contactId,
        closeDate: deal.closeDate ? format(new Date(deal.closeDate), 'yyyy-MM-dd') : '',
        description: deal.description,
      });
    }
  }, [deal, navigate, dealForm]);

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const handleEditDeal = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteDeal = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDeal = () => {
    deleteDeal(deal.id);
    toast.success('Deal deleted successfully');
    navigate('/deals');
  };

  const handleAddActivity = () => {
    activityForm.reset({
      type: '',
      subject: '',
      description: '',
    });
    setIsActivityModalOpen(true);
  };

  const handleAddTask = () => {
    taskForm.reset({
      title: '',
      description: '',
      dueDate: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'), // Tomorrow
      priority: 'medium',
      status: 'pending',
      assignedTo: 'You',
    });
    setIsTaskModalOpen(true);
  };

  const onEditSubmit = (data) => {
    const selectedContact = contacts.find(c => c.id === data.contactId);
    const dealData = {
      ...data,
      value: parseFloat(data.value),
      probability: parseInt(data.probability),
      company: selectedContact ? selectedContact.company : deal.company,
      companyId: selectedContact ? selectedContact.companyId : deal.companyId,
    };

    updateDeal({ ...deal, ...dealData });
    toast.success('Deal updated successfully');
    setIsEditModalOpen(false);
  };

  const onActivitySubmit = async (data) => {
    try {
      await addActivity({
        ...data,
        dealId: deal.id,
        contactId: deal.contactId,
        companyId: deal.companyId,
      });
      
      toast.success('Activity added successfully');
      setIsActivityModalOpen(false);
      activityForm.reset();
    } catch (error) {
      toast.error('Failed to add activity');
      console.error('Error with activity:', error);
    }
  };

  const onTaskSubmit = async (data) => {
    try {
      const taskData = {
        ...data,
        dueDate: data.dueDate,
        dealId: deal.id,
        contactId: deal.contactId,
        companyId: deal.companyId,
      };
      
      await addTask(taskData);
      toast.success('Task added successfully');
      setIsTaskModalOpen(false);
      taskForm.reset();
    } catch (error) {
      toast.error('Failed to add task');
      console.error('Error with task:', error);
    }
  };

  const getStageColor = (stageId) => {
    const stage = DEAL_STAGES.find(s => s.id === stageId);
    return stage ? stage.color : 'from-gray-400 to-gray-500';
  };

  const getDaysToClose = () => {
    if (!deal.closeDate) return null;
    
    const closeDate = parseISO(deal.closeDate);
    const today = new Date();
    const daysToClose = differenceInDays(closeDate, today);
    
    if (daysToClose < 0) {
      if (deal.stage === 'closed-won' || deal.stage === 'closed-lost') {
        return `Closed ${Math.abs(daysToClose)} days ago`;
      }
      return `Overdue by ${Math.abs(daysToClose)} days`;
    }
    
    if (daysToClose === 0) return 'Due today';
    if (daysToClose === 1) return 'Due tomorrow';
    return `${daysToClose} days to close`;
  };

  const getStageProgress = () => {
    const stageOrder = DEAL_STAGES.findIndex(s => s.id === deal.stage);
    if (stageOrder === -1) return 0;
    
    // Calculate progress percentage (excluding closed stages for better visualization)
    // We use 4 as denominator because we have 4 active stages (lead, qualified, proposal, negotiation)
    const progress = Math.min(stageOrder, 4) / 4 * 100;
    return progress;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'email': return FiMail;
      case 'call': return FiPhone;
      case 'meeting': return FiCalendar;
      case 'note': return FiFileText;
      case 'task': return FiCheckSquare;
      case 'deal': return FiDollarSign;
      default: return FiActivity;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiInfo },
    { id: 'activities', name: 'Activities', icon: FiActivity, count: dealActivities.length },
    { id: 'tasks', name: 'Tasks', icon: FiCheckSquare, count: dealTasks.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/deals')} icon={FiArrowLeft}>
            Back to Deals
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleEditDeal} icon={FiEdit2} variant="outline">
            Edit Deal
          </Button>
          <Button onClick={handleDeleteDeal} icon={FiTrash2} variant="danger">
            Delete
          </Button>
        </div>
      </div>

      {/* Deal Header Card */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getStageColor(deal.stage)} flex items-center justify-center flex-shrink-0`}>
              <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deal.name}
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <div className="flex items-center">
                  <SafeIcon icon={FiBuilding} className="w-4 h-4 mr-1" />
                  <span>{deal.company}</span>
                </div>
                
                {relatedContact && (
                  <div className="flex items-center">
                    <SafeIcon icon={FiUser} className="w-4 h-4 mr-1" />
                    <span>{relatedContact.firstName} {relatedContact.lastName}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-1" />
                  <span>{formatDate(deal.closeDate)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  deal.stage === 'closed-won' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  deal.stage === 'closed-lost' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {DEAL_STAGES.find(s => s.id === deal.stage)?.name}
                </span>
                
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  deal.probability >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  deal.probability >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {deal.probability}% Probability
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ${deal.value.toLocaleString()}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center">
                <SafeIcon icon={FiClock} className="w-4 h-4 mr-1" />
                <span>{getDaysToClose()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {deal.stage !== 'closed-won' && deal.stage !== 'closed-lost' && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Deal Progress</span>
              <span>{Math.round(getStageProgress())}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-2 bg-gradient-to-r from-blue-400 to-primary-500 rounded-full"
                style={{ width: `${getStageProgress()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Lead</span>
              <span>Qualified</span>
              <span>Proposal</span>
              <span>Negotiation</span>
              <span>Closed</span>
            </div>
          </div>
        )}
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
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
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
              {/* Deal Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Deal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Value:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ${deal.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Stage:</span>
                      <span className="text-gray-900 dark:text-white">
                        {DEAL_STAGES.find(s => s.id === deal.stage)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Probability:</span>
                      <span className="text-gray-900 dark:text-white">{deal.probability}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Close Date:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(deal.closeDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(deal.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(deal.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {deal.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {deal.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Associated Contact & Company */}
              <div className="space-y-6">
                {relatedContact && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Contact Information
                    </h3>
                    <Card>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-white">
                            {relatedContact.firstName?.[0]}{relatedContact.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {relatedContact.firstName} {relatedContact.lastName}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {relatedContact.position}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={FiMail} className="w-4 h-4 text-gray-400" />
                          <a href={`mailto:${relatedContact.email}`} className="text-primary-600 hover:text-primary-700">
                            {relatedContact.email}
                          </a>
                        </div>
                        {relatedContact.phone && (
                          <div className="flex items-center space-x-2">
                            <SafeIcon icon={FiPhone} className="w-4 h-4 text-gray-400" />
                            <a href={`tel:${relatedContact.phone}`} className="text-primary-600 hover:text-primary-700">
                              {relatedContact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => navigate(`/contacts/${relatedContact.id}`)}
                        >
                          View Contact
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {relatedCompany && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Company Information
                    </h3>
                    <Card>
                      <div className="flex items-center space-x-4">
                        {relatedCompany.logo_url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                            <img 
                              src={relatedCompany.logo_url} 
                              alt={relatedCompany.name} 
                              className="w-full h-full object-contain" 
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <SafeIcon icon={FiBuilding} className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {relatedCompany.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {relatedCompany.industry}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        {relatedCompany.website && (
                          <div className="flex items-center space-x-2">
                            <SafeIcon icon={FiGlobe} className="w-4 h-4 text-gray-400" />
                            <a 
                              href={relatedCompany.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {relatedCompany.website}
                            </a>
                          </div>
                        )}
                        {relatedCompany.email && (
                          <div className="flex items-center space-x-2">
                            <SafeIcon icon={FiMail} className="w-4 h-4 text-gray-400" />
                            <a 
                              href={`mailto:${relatedCompany.email}`} 
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {relatedCompany.email}
                            </a>
                          </div>
                        )}
                        {relatedCompany.phone && (
                          <div className="flex items-center space-x-2">
                            <SafeIcon icon={FiPhone} className="w-4 h-4 text-gray-400" />
                            <a 
                              href={`tel:${relatedCompany.phone}`} 
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {relatedCompany.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Recent Activities */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Activity
                    </h3>
                    <Button size="sm" onClick={handleAddActivity} icon={FiPlus}>
                      Add Activity
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {dealActivities.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <SafeIcon 
                            icon={getActivityIcon(activity.type)} 
                            className="w-4 h-4 text-gray-600 dark:text-gray-400" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.subject}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {dealActivities.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No activities yet
                      </p>
                    )}
                    
                    {dealActivities.length > 3 && (
                      <button 
                        onClick={() => setActiveTab('activities')}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View all activities
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Deal Activities
                </h3>
                <Button onClick={handleAddActivity} icon={FiPlus}>
                  Add Activity
                </Button>
              </div>

              {dealActivities.length === 0 ? (
                <div className="text-center py-12">
                  <SafeIcon icon={FiActivity} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No activities recorded</p>
                  <Button onClick={handleAddActivity} icon={FiPlus} className="mt-4">
                    Add First Activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dealActivities.map((activity) => (
                    <Card key={activity.id} className="hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <SafeIcon 
                            icon={getActivityIcon(activity.type)} 
                            className="w-5 h-5 text-gray-600 dark:text-gray-400" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {activity.subject}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">
                              {activity.type}
                            </span>
                            
                            {activity.contactId && activity.contactId !== deal.contactId && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                                {contacts.find(c => c.id === activity.contactId)?.firstName} {contacts.find(c => c.id === activity.contactId)?.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Deal Tasks
                </h3>
                <Button onClick={handleAddTask} icon={FiPlus}>
                  Add Task
                </Button>
              </div>

              {dealTasks.length === 0 ? (
                <div className="text-center py-12">
                  <SafeIcon icon={FiCheckSquare} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No tasks assigned</p>
                  <Button onClick={handleAddTask} icon={FiPlus} className="mt-4">
                    Add First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dealTasks.map((task) => {
                    const isPastDue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
                    
                    return (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="mt-1">
                            <button
                              onClick={() => {
                                const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                                updateTask({
                                  ...task,
                                  status: newStatus
                                });
                                toast.success(`Task marked as ${newStatus}`);
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
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium mb-1 ${
                              task.status === 'completed'
                                ? 'line-through text-gray-500 dark:text-gray-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {task.title}
                            </h4>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                              {task.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center space-x-1">
                                <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${
                                  isPastDue ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  Due: {formatDate(task.dueDate)}
                                  {isPastDue && ' (Overdue)'}
                                </span>
                              </div>
                              
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                task.priority === 'high'
                                  ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                                  : task.priority === 'medium'
                                  ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                                  : 'text-green-600 bg-green-50 dark:bg-green-900/20'
                              }`}>
                                {task.priority}
                              </span>
                              
                              <div className="flex items-center space-x-1">
                                <SafeIcon icon={FiUser} className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {task.assignedTo}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Edit Deal Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Deal"
        size="lg"
      >
        <form onSubmit={dealForm.handleSubmit(onEditSubmit)} className="space-y-4">
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
                <p className="text-red-500 text-xs mt-1">
                  {dealForm.formState.errors.probability.message}
                </p>
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
                {DEAL_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact
              </label>
              <select
                {...dealForm.register('contactId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} - {contact.company}
                  </option>
                ))}
              </select>
            </div>
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
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Deal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Deal"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="mt-0.5">
              <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-400">
                Confirm Deletion
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Are you sure you want to delete the deal "<span className="font-medium">{deal.name}</span>"? This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="danger"
              onClick={confirmDeleteDeal}
            >
              Delete Deal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Add Activity"
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
            <Button type="button" variant="secondary" onClick={() => setIsActivityModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Activity
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Task"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assigned To
            </label>
            <input
              {...taskForm.register('assignedTo')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DealDetail;