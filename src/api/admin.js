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

// Categories
export const fetchCategories = async () => {
  if (useRealApi) return apiClient.get('/api/v1/categories')
  return withMockData((data) => [...data.categories])
}

export const createCategory = async (payload) => {
  if (useRealApi) return apiClient.post('/api/v1/categories', payload)
  return withMockData((data) => {
    const id = `cat-${Date.now()}`
    const newItem = { id, ...payload }
    data.categories.push(newItem)
    return newItem
  })
}

export const updateCategory = async (id, payload) => {
  if (useRealApi) return apiClient.put(`/api/v1/categories/${id}`, payload)
  return withMockData((data) => {
    const idx = data.categories.findIndex((item) => item.id === id)
    if (idx === -1) throw new Error('Category not found')
    data.categories[idx] = { ...data.categories[idx], ...payload }
    return data.categories[idx]
  })
}

export const deleteCategory = async (id) => {
  if (useRealApi) return apiClient.delete(`/api/v1/categories/${id}`)
  return withMockData((data) => {
    data.categories = data.categories.filter((item) => item.id !== id)
    return true
  })
}

// Rooms
export const fetchRooms = async () => {
  if (useRealApi) return apiClient.get('/api/v1/rooms')
  return withMockData((data) => [...data.rooms])
}

export const createRoom = async (payload) => {
  if (useRealApi) return apiClient.post('/api/v1/rooms', payload)
  return withMockData((data) => {
    const id = `room-${Date.now()}`
    const newItem = { id, ...payload }
    data.rooms.push(newItem)
    return newItem
  })
}

export const updateRoom = async (id, payload) => {
  if (useRealApi) return apiClient.put(`/api/v1/rooms/${id}`, payload)
  return withMockData((data) => {
    const idx = data.rooms.findIndex((item) => item.id === id)
    if (idx === -1) throw new Error('Room not found')
    data.rooms[idx] = { ...data.rooms[idx], ...payload }
    return data.rooms[idx]
  })
}

export const deleteRoom = async (id) => {
  if (useRealApi) return apiClient.delete(`/api/v1/rooms/${id}`)
  return withMockData((data) => {
    data.rooms = data.rooms.filter((item) => item.id !== id)
    return true
  })
}

// Departments
export const fetchDepartments = async () => {
  if (useRealApi) return apiClient.get('/api/v1/departments')
  return withMockData((data) => [...data.departments])
}

export const createDepartment = async (payload) => {
  if (useRealApi) return apiClient.post('/api/v1/departments', payload)
  return withMockData((data) => {
    const id = `dept-${Date.now()}`
    const newItem = { id, ...payload }
    data.departments.push(newItem)
    return newItem
  })
}

export const updateDepartment = async (id, payload) => {
  if (useRealApi) return apiClient.put(`/api/v1/departments/${id}`, payload)
  return withMockData((data) => {
    const idx = data.departments.findIndex((item) => item.id === id)
    if (idx === -1) throw new Error('Department not found')
    data.departments[idx] = { ...data.departments[idx], ...payload }
    return data.departments[idx]
  })
}

export const deleteDepartment = async (id) => {
  if (useRealApi) return apiClient.delete(`/api/v1/departments/${id}`)
  return withMockData((data) => {
    data.departments = data.departments.filter((item) => item.id !== id)
    return true
  })
}

// Tickets
export const fetchTickets = async () => {
  if (useRealApi) return apiClient.get('/api/v1/tickets')
  return withMockData((data) => [...data.tickets])
}

export const createTicket = async (payload) => {
  if (useRealApi) return apiClient.post('/api/v1/tickets', payload)
  return withMockData((data) => {
    const id = `TCK-${Math.floor(1000 + Math.random() * 9000)}`
    const newItem = {
      id,
      status: 'New',
      statusKey: 'new',
      priority: 'Medium',
      slaDue: 'Tomorrow 17:00',
      ...payload,
      statusKey: payload?.statusKey || toStatusKey(payload?.status || 'new'),
    }
    data.tickets.unshift(newItem)
    return newItem
  })
}

export const updateTicket = async (id, payload) => {
  if (useRealApi) return apiClient.patch(`/api/v1/tickets/${id}`, payload)
  return withMockData((data) => {
    const idx = data.tickets.findIndex((item) => item.id === id)
    if (idx === -1) throw new Error('Ticket not found')
    data.tickets[idx] = {
      ...data.tickets[idx],
      ...payload,
      statusKey: payload?.statusKey
        ? payload.statusKey
        : toStatusKey(payload?.status || data.tickets[idx].status),
    }
    return data.tickets[idx]
  })
}

export const deleteTicket = async (id) => {
  if (useRealApi) return apiClient.delete(`/api/v1/tickets/${id}`)
  return withMockData((data) => {
    data.tickets = data.tickets.filter((item) => item.id !== id)
    return true
  })
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
