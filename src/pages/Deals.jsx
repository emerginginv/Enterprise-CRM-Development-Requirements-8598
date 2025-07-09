import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDrag, useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiBuilding,
  FiGrid,
  FiList,
  FiEye,
  FiArrowRight
} = FiIcons;

const DEAL_STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
  { id: 'qualified', name: 'Qualified', color: 'bg-blue-500' },
  { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
  { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500' },
  { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500' },
];

const DealCard = ({ deal, onEdit, onDelete, onView }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'deal',
    item: { id: deal.id, stage: deal.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const probabilityColor = deal.probability >= 75 
    ? 'text-green-600' 
    : deal.probability >= 50 
      ? 'text-yellow-600' 
      : 'text-red-600';

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(deal);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(deal.id);
  };

  const handleView = (e) => {
    e.stopPropagation();
    onView(deal.id);
  };

  return (
    <motion.div 
      ref={drag}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-move"
      onClick={handleView}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
          {deal.name}
        </h4>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <SafeIcon icon={FiDollarSign} className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ${deal.value.toLocaleString()}
            </span>
          </div>
          <span className={`text-xs font-medium ${probabilityColor}`}>
            {deal.probability}%
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <SafeIcon icon={FiBuilding} className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {deal.company}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <SafeIcon icon={FiCalendar} className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(deal.closeDate), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Action buttons at the bottom */}
      <div className="flex items-center justify-end space-x-1 pt-1 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleView}
          className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="View Deal"
        >
          <SafeIcon icon={FiEye} className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleEdit}
          className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Edit Deal"
        >
          <SafeIcon icon={FiEdit2} className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Delete Deal"
        >
          <SafeIcon icon={FiTrash2} className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

const StageColumn = ({ stage, deals, onDrop, onEdit, onDelete, onView }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'deal',
    drop: (item) => {
      if (item.stage !== stage.id) {
        onDrop(item.id, stage.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const stageDeals = deals.filter(deal => deal.stage === stage.id);
  const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-80 ${isOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''} rounded-lg transition-colors`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${stage.color}`} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {stage.name}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({stageDeals.length})
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            ${totalValue.toLocaleString()}
          </div>
        </div>
        <div className="space-y-2 min-h-96">
          {stageDeals.map((deal) => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              onEdit={onEdit} 
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Deals = () => {
  const navigate = useNavigate();
  const { deals, contacts, companies, addDeal, updateDeal, deleteDeal } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDealId, setDeletingDealId] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const handleAddDeal = () => {
    setEditingDeal(null);
    reset();
    setIsModalOpen(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    reset(deal);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (dealId) => {
    setDeletingDealId(dealId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingDealId) {
      deleteDeal(deletingDealId);
      toast.success('Deal deleted successfully');
      setIsDeleteModalOpen(false);
      setDeletingDealId(null);
    }
  };

  const handleDrop = (dealId, newStage) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      updateDeal({ ...deal, stage: newStage });
      toast.success('Deal moved successfully');
    }
  };

  const onSubmit = (data) => {
    const contact = contacts.find(c => c.id === data.contactId);
    const dealData = {
      ...data,
      value: parseFloat(data.value),
      probability: parseInt(data.probability),
      company: contact ? contact.company : data.company,
    };

    if (editingDeal) {
      updateDeal({ ...editingDeal, ...dealData });
      toast.success('Deal updated successfully');
    } else {
      addDeal(dealData);
      toast.success('Deal added successfully');
    }
    setIsModalOpen(false);
    reset();
  };

  const handleViewDeal = (dealId) => {
    navigate(`/deals/${dealId}`);
  };

  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const averageDealSize = deals.length > 0 ? totalPipelineValue / deals.length : 0;

  const getStageColor = (stage) => {
    const stageObj = DEAL_STAGES.find(s => s.id === stage);
    return stageObj ? stageObj.color : 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sales Pipeline
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your deals and track sales progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title="Kanban View"
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
          <Button onClick={handleAddDeal} icon={FiPlus} className="shadow-lg">
            Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Pipeline Value
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalPipelineValue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <SafeIcon icon={FiUser} className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Deals
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {deals.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Deal Size
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${Math.round(averageDealSize).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <Card padding={false} className="overflow-x-auto">
          <div className="flex space-x-1 p-1 min-w-max">
            {DEAL_STAGES.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={deals}
                onDrop={handleDrop}
                onEdit={handleEditDeal}
                onDelete={handleDeletePrompt}
                onView={handleViewDeal}
              />
            ))}
          </div>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th scope="col" className="px-6 py-3">Deal Name</th>
                  <th scope="col" className="px-6 py-3">Stage</th>
                  <th scope="col" className="px-6 py-3">Company</th>
                  <th scope="col" className="px-6 py-3">Value</th>
                  <th scope="col" className="px-6 py-3">Probability</th>
                  <th scope="col" className="px-6 py-3">Close Date</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal, index) => (
                  <motion.tr 
                    key={deal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleViewDeal(deal.id)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {deal.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStageColor(deal.stage)}`}></div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          deal.stage === 'closed-won' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                            : deal.stage === 'closed-lost' 
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {deal.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {deal.company}
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
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDeal(deal.id)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="View Deal"
                        >
                          <SafeIcon icon={FiEye} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditDeal(deal)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Edit Deal"
                        >
                          <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(deal.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Delete Deal"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {deals.length === 0 && (
            <div className="text-center py-12">
              <SafeIcon icon={FiDollarSign} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No deals found</p>
              <Button onClick={handleAddDeal} icon={FiPlus} className="mt-4">
                Add Your First Deal
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Add/Edit Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDeal ? 'Edit Deal' : 'Add New Deal'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deal Name
            </label>
            <input
              {...register('name', { required: 'Deal name is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Value
              </label>
              <input
                type="number"
                {...register('value', { required: 'Value is required', min: 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.value && (
                <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>
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
                {...register('probability', { required: 'Probability is required', min: 0, max: 100 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.probability && (
                <p className="text-red-500 text-xs mt-1">{errors.probability.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stage
              </label>
              <select
                {...register('stage')}
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
                {...register('contactId')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                {...register('closeDate', { required: 'Close date is required' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.closeDate && (
                <p className="text-red-500 text-xs mt-1">{errors.closeDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <select
                {...register('companyId')}
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingDeal ? 'Update Deal' : 'Add Deal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Deal"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this deal? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Deals;