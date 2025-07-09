import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

const CRMContext = createContext()

export const useCRM = () => {
  const context = useContext(CRMContext)
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider')
  }
  return context
}

// Initial state with sample data
const initialState = {
  contacts: [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      company: 'Tech Corp',
      companyId: '1',
      position: 'CEO',
      status: 'active',
      source: 'website',
      value: 50000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@business.com',
      phone: '+1-555-0124',
      company: 'Business Solutions',
      companyId: '2',
      position: 'CTO',
      status: 'prospect',
      source: 'referral',
      value: 75000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  companies: [
    {
      id: '1',
      name: 'Tech Corp',
      industry: 'Technology',
      size: '11-50',
      website: 'https://techcorp.com',
      phone: '+1-555-0100',
      email: 'contact@techcorp.com',
      address: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
      description: 'Leading technology company',
      status: 'active',
      revenue: 1000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Business Solutions',
      industry: 'Consulting',
      size: '51-200',
      website: 'https://bizsolv.com',
      phone: '+1-555-0200',
      email: 'hello@bizsolv.com',
      address: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001',
      description: 'Business consulting services',
      status: 'prospect',
      revenue: 2000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  deals: [
    {
      id: '1',
      name: 'Tech Corp Implementation',
      value: 50000,
      stage: 'proposal',
      probability: 75,
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      contactId: '1',
      companyId: '1',
      company: 'Tech Corp',
      description: 'Full CRM implementation project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Business Solutions Upgrade',
      value: 75000,
      stage: 'negotiation',
      probability: 50,
      closeDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      contactId: '2',
      companyId: '2',
      company: 'Business Solutions',
      description: 'System upgrade and training',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: '1',
      title: 'Follow up with John Doe',
      description: 'Schedule demo call for next week',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      status: 'pending',
      contactId: '1',
      companyId: '1',
      dealId: '1',
      assignedTo: 'You',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Prepare proposal for Business Solutions',
      description: 'Create detailed proposal document',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      status: 'pending',
      contactId: '2',
      companyId: '2',
      dealId: '2',
      assignedTo: 'You',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  activities: [
    {
      id: '1',
      type: 'email',
      subject: 'Initial contact with Tech Corp',
      description: 'Sent introduction email to John Doe',
      contactId: '1',
      companyId: '1',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'call',
      subject: 'Discovery call with Business Solutions',
      description: 'Had initial discovery call with Jane Smith',
      contactId: '2',
      companyId: '2',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    }
  ],
  loading: false,
  error: null,
}

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CONTACTS: 'SET_CONTACTS',
  SET_COMPANIES: 'SET_COMPANIES',
  SET_DEALS: 'SET_DEALS',
  SET_TASKS: 'SET_TASKS',
  SET_ACTIVITIES: 'SET_ACTIVITIES',
  ADD_CONTACT: 'ADD_CONTACT',
  UPDATE_CONTACT: 'UPDATE_CONTACT',
  DELETE_CONTACT: 'DELETE_CONTACT',
  ADD_COMPANY: 'ADD_COMPANY',
  UPDATE_COMPANY: 'UPDATE_COMPANY',
  DELETE_COMPANY: 'DELETE_COMPANY',
  ADD_DEAL: 'ADD_DEAL',
  UPDATE_DEAL: 'UPDATE_DEAL',
  DELETE_DEAL: 'DELETE_DEAL',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY',
  DELETE_ACTIVITY: 'DELETE_ACTIVITY',
}

// Reducer
const crmReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload }
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload }
    case actionTypes.SET_CONTACTS:
      return { ...state, contacts: action.payload }
    case actionTypes.SET_COMPANIES:
      return { ...state, companies: action.payload }
    case actionTypes.SET_DEALS:
      return { ...state, deals: action.payload }
    case actionTypes.SET_TASKS:
      return { ...state, tasks: action.payload }
    case actionTypes.SET_ACTIVITIES:
      return { ...state, activities: action.payload }
    case actionTypes.ADD_CONTACT:
      return { ...state, contacts: [...state.contacts, action.payload] }
    case actionTypes.UPDATE_CONTACT:
      return {
        ...state,
        contacts: state.contacts.map(contact =>
          contact.id === action.payload.id ? action.payload : contact
        ),
      }
    case actionTypes.DELETE_CONTACT:
      return {
        ...state,
        contacts: state.contacts.filter(contact => contact.id !== action.payload),
      }
    case actionTypes.ADD_COMPANY:
      return { ...state, companies: [...state.companies, action.payload] }
    case actionTypes.UPDATE_COMPANY:
      return {
        ...state,
        companies: state.companies.map(company =>
          company.id === action.payload.id ? action.payload : company
        ),
      }
    case actionTypes.DELETE_COMPANY:
      return {
        ...state,
        companies: state.companies.filter(company => company.id !== action.payload),
      }
    case actionTypes.ADD_DEAL:
      return { ...state, deals: [...state.deals, action.payload] }
    case actionTypes.UPDATE_DEAL:
      return {
        ...state,
        deals: state.deals.map(deal =>
          deal.id === action.payload.id ? action.payload : deal
        ),
      }
    case actionTypes.DELETE_DEAL:
      return {
        ...state,
        deals: state.deals.filter(deal => deal.id !== action.payload),
      }
    case actionTypes.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] }
    case actionTypes.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      }
    case actionTypes.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      }
    case actionTypes.ADD_ACTIVITY:
      return { ...state, activities: [action.payload, ...state.activities] }
    case actionTypes.UPDATE_ACTIVITY:
      return {
        ...state,
        activities: state.activities.map(activity =>
          activity.id === action.payload.id ? action.payload : activity
        ),
      }
    case actionTypes.DELETE_ACTIVITY:
      return {
        ...state,
        activities: state.activities.filter(activity => activity.id !== action.payload),
      }
    default:
      return state
  }
}

export const CRMProvider = ({ children }) => {
  const [state, dispatch] = useReducer(crmReducer, initialState)
  const { user, isAuthenticated } = useAuth()
  const [initialized, setInitialized] = useState(false)

  // Initialize with sample data
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ CRM initialized with sample data')
      setInitialized(true)
    }
  }, [isAuthenticated, user])

  // Helper function to generate unique ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Company Actions
  const addCompany = async (company) => {
    if (!user) return
    try {
      const newCompany = {
        ...company,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.ADD_COMPANY, payload: newCompany })
      
      // Add activity
      await addActivity({
        type: 'company',
        subject: 'New company created',
        description: `Added ${newCompany.name} as a company`,
        companyId: newCompany.id
      })
      return newCompany
    } catch (error) {
      console.error('Error adding company:', error)
      toast.error('Failed to add company')
      throw error
    }
  }

  const updateCompany = async (company) => {
    if (!user) return
    try {
      const updatedCompany = {
        ...company,
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.UPDATE_COMPANY, payload: updatedCompany })
      
      // Add activity
      await addActivity({
        type: 'company',
        subject: 'Company updated',
        description: `Updated company information for ${updatedCompany.name}`,
        companyId: updatedCompany.id
      })
      return updatedCompany
    } catch (error) {
      console.error('Error updating company:', error)
      toast.error('Failed to update company')
      throw error
    }
  }

  const deleteCompany = async (companyId) => {
    if (!user) return
    try {
      dispatch({ type: actionTypes.DELETE_COMPANY, payload: companyId })
      return true
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('Failed to delete company')
      throw error
    }
  }

  // Contact Actions
  const addContact = async (contact) => {
    if (!user) return
    try {
      const newContact = {
        ...contact,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.ADD_CONTACT, payload: newContact })
      
      // Add activity
      await addActivity({
        type: 'contact',
        subject: 'New contact created',
        description: `Added ${newContact.firstName} ${newContact.lastName} as a contact`,
        contactId: newContact.id,
        companyId: newContact.companyId
      })
      return newContact
    } catch (error) {
      console.error('Error adding contact:', error)
      toast.error('Failed to add contact')
      throw error
    }
  }

  const updateContact = async (contact) => {
    if (!user) return
    try {
      const updatedContact = {
        ...contact,
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.UPDATE_CONTACT, payload: updatedContact })
      
      // Add activity
      await addActivity({
        type: 'contact',
        subject: 'Contact updated',
        description: `Updated contact information for ${updatedContact.firstName} ${updatedContact.lastName}`,
        contactId: updatedContact.id,
        companyId: updatedContact.companyId
      })
      return updatedContact
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Failed to update contact')
      throw error
    }
  }

  const deleteContact = async (contactId) => {
    if (!user) return
    try {
      dispatch({ type: actionTypes.DELETE_CONTACT, payload: contactId })
      return true
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
      throw error
    }
  }

  // Deal Actions
  const addDeal = async (deal) => {
    if (!user) return
    try {
      const newDeal = {
        ...deal,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.ADD_DEAL, payload: newDeal })
      
      // Add activity
      await addActivity({
        type: 'deal',
        subject: 'New deal created',
        description: `Added "${newDeal.name}" as a deal`,
        contactId: newDeal.contactId,
        companyId: newDeal.companyId
      })
      return newDeal
    } catch (error) {
      console.error('Error adding deal:', error)
      toast.error('Failed to add deal')
      throw error
    }
  }

  const updateDeal = async (deal) => {
    if (!user) return
    try {
      const updatedDeal = {
        ...deal,
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.UPDATE_DEAL, payload: updatedDeal })
      
      // Add activity if stage changed
      const oldDeal = state.deals.find(d => d.id === deal.id)
      if (oldDeal && deal.stage !== oldDeal.stage) {
        await addActivity({
          type: 'deal',
          subject: 'Deal stage updated',
          description: `Updated deal "${updatedDeal.name}" to stage: ${updatedDeal.stage}`,
          contactId: updatedDeal.contactId,
          companyId: updatedDeal.companyId
        })
      }
      return updatedDeal
    } catch (error) {
      console.error('Error updating deal:', error)
      toast.error('Failed to update deal')
      throw error
    }
  }

  const deleteDeal = async (dealId) => {
    if (!user) return
    try {
      dispatch({ type: actionTypes.DELETE_DEAL, payload: dealId })
      return true
    } catch (error) {
      console.error('Error deleting deal:', error)
      toast.error('Failed to delete deal')
      throw error
    }
  }

  // Task Actions
  const addTask = async (task) => {
    if (!user) return
    try {
      const newTask = {
        ...task,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.ADD_TASK, payload: newTask })
      
      // Add activity
      await addActivity({
        type: 'task',
        subject: 'New task created',
        description: `Added task "${newTask.title}"`,
        contactId: newTask.contactId,
        companyId: newTask.companyId
      })
      return newTask
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
      throw error
    }
  }

  const updateTask = async (task) => {
    if (!user) return
    try {
      const updatedTask = {
        ...task,
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.UPDATE_TASK, payload: updatedTask })
      
      // Add activity if status changed to completed
      const oldTask = state.tasks.find(t => t.id === task.id)
      if (oldTask?.status !== 'completed' && updatedTask.status === 'completed') {
        await addActivity({
          type: 'task',
          subject: 'Task completed',
          description: `Completed task "${updatedTask.title}"`,
          contactId: updatedTask.contactId,
          companyId: updatedTask.companyId
        })
      }
      return updatedTask
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
      throw error
    }
  }

  const deleteTask = async (taskId) => {
    if (!user) return
    try {
      dispatch({ type: actionTypes.DELETE_TASK, payload: taskId })
      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
      throw error
    }
  }

  // Activity Actions
  const addActivity = async (activity) => {
    if (!user) return
    try {
      const newActivity = {
        ...activity,
        id: generateId(),
        createdAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.ADD_ACTIVITY, payload: newActivity })
      return newActivity
    } catch (error) {
      console.error('Error adding activity:', error)
      return null
    }
  }

  const updateActivity = async (activity) => {
    if (!user) return
    try {
      const updatedActivity = {
        ...activity,
        updatedAt: new Date().toISOString()
      }
      dispatch({ type: actionTypes.UPDATE_ACTIVITY, payload: updatedActivity })
      return updatedActivity
    } catch (error) {
      console.error('Error updating activity:', error)
      toast.error('Failed to update activity')
      throw error
    }
  }

  const deleteActivity = async (activityId) => {
    if (!user) return
    try {
      dispatch({ type: actionTypes.DELETE_ACTIVITY, payload: activityId })
      return true
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error('Failed to delete activity')
      throw error
    }
  }

  const value = {
    ...state,
    addCompany,
    updateCompany,
    deleteCompany,
    addContact,
    updateContact,
    deleteContact,
    addDeal,
    updateDeal,
    deleteDeal,
    addTask,
    updateTask,
    deleteTask,
    addActivity,
    updateActivity,
    deleteActivity,
  }

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  )
}