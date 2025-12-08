import { apiClient } from './client'

const STORAGE_KEY = 'mock-admin-data-v1'
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
const useRealApi = String(import.meta.env.VITE_USE_REAL_API || '').toLowerCase() === 'true'

const defaultData = {
  categories: [
    {
      id: 'cat-csvc',
      name: 'CSVC',
      description: 'Cơ sở vật chất / Facility infrastructure',
      defaultPriority: 'Medium',
      slaResponse: '4 hours',
      slaResolve: '2 days',
    },
    {
      id: 'cat-wifi',
      name: 'WiFi',
      description: 'Mạng không dây / Wireless network',
      defaultPriority: 'High',
      slaResponse: '30 minutes',
      slaResolve: '4 hours',
    },
    {
      id: 'cat-device',
      name: 'Thiết bị',
      description: 'Máy chiếu, máy tính, thiết bị lab',
      defaultPriority: 'High',
      slaResponse: '1 hour',
      slaResolve: '1 day',
    },
  ],
  rooms: [
    {
      id: 'room-a1-203',
      building: 'A1',
      room: '203',
      department: 'CSVC',
      notes: 'Large lecture hall',
    },
    {
      id: 'room-lib-2f',
      building: 'Library',
      room: '2F-Reading',
      department: 'Library',
      notes: 'Quiet study area',
    },
  ],
  departments: [
    {
      id: 'dept-it',
      name: 'IT',
      type: 'IT',
      email: 'it@university.edu',
      phone: '0123 456 789',
    },
    {
      id: 'dept-csvc',
      name: 'CSVC',
      type: 'CSVC',
      email: 'csvc@university.edu',
      phone: '0987 654 321',
    },
    {
      id: 'dept-ktx',
      name: 'KTX',
      type: 'KTX',
      email: 'ktx@university.edu',
      phone: '0909 000 111',
    },
  ],
  tickets: [
    {
      id: 'TCK-1024',
      category: 'WiFi',
      room: 'A1-203',
      requestedBy: 'Minh',
      assignedTo: 'IT Staff 1',
      status: 'In Progress',
      statusKey: 'in-progress',
      slaDue: 'Today 17:00',
      priority: 'High',
      description: 'Wifi chập chờn tại phòng A1-203',
    },
    {
      id: 'TCK-1023',
      category: 'CSVC',
      room: 'Library 2F',
      requestedBy: 'Lan',
      assignedTo: 'CSVC Staff 2',
      status: 'New',
      statusKey: 'new',
      slaDue: 'Tomorrow 10:00',
      priority: 'Medium',
      description: 'Bàn học lung lay, cần sửa',
    },
    {
      id: 'TCK-1019',
      category: 'Thiết bị',
      room: 'Lab B3-105',
      requestedBy: 'Huy',
      assignedTo: 'IT Staff 3',
      status: 'Overdue',
      statusKey: 'overdue',
      slaDue: 'Yesterday 15:30',
      priority: 'Urgent',
      description: 'Máy chiếu không bật được',
    },
  ],
}

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_err) {
    // ignore storage errors and fall back
  }
  return { ...defaultData }
}

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (_err) {
    // ignore persistence errors in mock mode
  }
}

const withMockData = async (fn) => {
  const data = loadData()
  const result = await fn(data)
  saveData(data)
  await delay()
  return result
}

const toStatusKey = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('progress')) return 'in-progress'
  if (normalized.includes('resolve')) return 'resolved'
  if (normalized.includes('overdue')) return 'overdue'
  if (normalized.includes('new')) return 'new'
  return 'other'
}

// Helper to convert object with numeric keys to array
const objectToArray = (obj) => {
  if (Array.isArray(obj)) return obj
  if (!obj || typeof obj !== 'object') return []
  return Object.values(obj)
}

// Helper to handle API responses with nested data
const extractData = (response) => {
  if (response?.data) {
    return objectToArray(response.data)
  }
  return objectToArray(response)
}

// Categories
export const fetchCategories = async () => {
  const response = await apiClient.get('/api/v1/categories')
  return extractData(response)
}

export const fetchActiveCategories = async () => {
  const response = await apiClient.get('/api/v1/categories/active')
  return extractData(response)
}

export const getCategoryById = async (id) => {
  const response = await apiClient.get(`/api/v1/categories/${id}`)
  return response?.data || response
}

export const createCategory = async (payload) => {
  return apiClient.post('/api/v1/categories', payload)
}

export const updateCategory = async (id, payload) => {
  return apiClient.patch(`/api/v1/categories/${id}`, payload)
}

export const deleteCategory = async (id) => {
  return apiClient.delete(`/api/v1/categories/${id}`)
}

// Departments
export const fetchDepartments = async () => {
  const response = await apiClient.get('/api/v1/departments')
  return extractData(response)
}

export const getDepartmentById = async (id) => {
  const response = await apiClient.get(`/api/v1/departments/${id}`)
  return response?.data || response
}

export const createDepartment = async (payload) => {
  return apiClient.post('/api/v1/departments', payload)
}

export const updateDepartment = async (id, payload) => {
  return apiClient.put(`/api/v1/departments/${id}`, payload)
}

export const deleteDepartment = async (id) => {
  return apiClient.delete(`/api/v1/departments/${id}`)
}

// Rooms
export const fetchRooms = async () => {
  const response = await apiClient.get('/api/v1/rooms')
  return extractData(response)
}

export const getRoomById = async (id) => {
  const response = await apiClient.get(`/api/v1/rooms/${id}`)
  return response?.data || response
}

export const createRoom = async (payload) => {
  return apiClient.post('/api/v1/rooms', payload)
}

export const updateRoom = async (id, payload) => {
  return apiClient.put(`/api/v1/rooms/${id}`, payload)
}

export const deleteRoom = async (id) => {
  return apiClient.delete(`/api/v1/rooms/${id}`)
}

// SLA Policies
export const fetchSlaPolicies = async () => {
  const response = await apiClient.get('/api/v1/sla-policies')
  return extractData(response)
}

export const fetchActiveSlaPolicies = async () => {
  const response = await apiClient.get('/api/v1/sla-policies/active')
  return extractData(response)
}

export const getSlaPolicyById = async (id) => {
  const response = await apiClient.get(`/api/v1/sla-policies/${id}`)
  return response?.data || response
}

export const createSlaPolicy = async (payload) => {
  return apiClient.post('/api/v1/sla-policies', payload)
}

export const updateSlaPolicy = async (id, payload) => {
  return apiClient.patch(`/api/v1/sla-policies/${id}`, payload)
}

export const deleteSlaPolicy = async (id) => {
  return apiClient.delete(`/api/v1/sla-policies/${id}`)
}

// Tickets
export const fetchTickets = async () => {
  const response = await apiClient.get('/api/v1/tickets')
  return extractData(response)
}

export const fetchParentTickets = async () => {
  const response = await apiClient.get('/api/v1/tickets/parent-tickets')
  return extractData(response)
}

export const fetchMyTickets = async () => {
  const response = await apiClient.get('/api/v1/tickets/my-tickets')
  return extractData(response)
}

export const fetchAssignedToMe = async () => {
  const response = await apiClient.get('/api/v1/tickets/assigned-to-me')
  return extractData(response)
}

export const fetchSubTickets = async (parentId) => {
  const response = await apiClient.get(`/api/v1/tickets/sub-tickets/${parentId}`)
  return extractData(response)
}

export const getTicketById = async (id) => {
  const response = await apiClient.get(`/api/v1/tickets/${id}`)
  return response?.data || response
}

export const createTicket = async (payload) => {
  return apiClient.post('/api/v1/tickets', payload)
}

export const updateTicket = async (id, payload) => {
  return apiClient.patch(`/api/v1/tickets/${id}`, payload)
}

export const deleteTicket = async (id) => {
  return apiClient.delete(`/api/v1/tickets/${id}`)
}

export const fetchPendingSplitTickets = async () => {
  const response = await apiClient.get('/api/v1/tickets/admin/pending-split')
  return extractData(response)
}

export const fetchWaitingAcceptanceTickets = async () => {
  const response = await apiClient.get('/api/v1/tickets/admin/waiting-acceptance')
  return extractData(response)
}

export const fetchStaffWorkload = async (staffId) => {
  const response = await apiClient.get(`/api/v1/tickets/staff/${staffId}/workload`)
  return response?.data || response
}

export const acceptTicket = async (id) => {
  return apiClient.post(`/api/v1/tickets/${id}/accept`)
}

export const denyTicket = async (id, payload) => {
  return apiClient.post(`/api/v1/tickets/${id}/deny`, payload)
}

export const splitTicketCategories = async (id, payload) => {
  return apiClient.post(`/api/v1/tickets/${id}/split-categories`, payload)
}

// Dashboard
export const fetchDashboardStats = async () => {
  if (useRealApi) return apiClient.get('/api/v1/admin/dashboard')
  return withMockData((data) => {
    const totalTickets = data.tickets.length
    const overdue = data.tickets.filter((t) => t.statusKey === 'overdue').length
    const ontime = totalTickets - overdue
    return {
      kpis: [
        { label: 'Total Tickets / Tổng số ticket', value: totalTickets },
        {
          label: 'On-time SLA / Đúng SLA',
          value: totalTickets ? `${Math.round((ontime / totalTickets) * 100)}%` : '0%',
        },
        { label: 'Overdue Tickets / Ticket trễ hạn', value: overdue },
      ],
      recentTickets: data.tickets.slice(0, 5),
    }
  })
}

export const adminApi = {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  fetchDashboardStats,
}
