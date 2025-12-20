import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton, DeleteConfirmModal } from '../../components/templates'
import { useNotificationSocket } from '../../context/NotificationSocketContext'
import { downloadFile } from '../../utils/fileDownload'
import { formatDate, getStatusColor } from '../../utils/ticketHelpers.jsx'

function MyTickets() {
  const navigate = useNavigate()
  const { socket } = useNotificationSocket()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [imagePopup, setImagePopup] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchRoomsForTickets = useCallback(async (ticketsList) => {
    const roomIds = [
      ...new Set(
        ticketsList
          .filter(
            (t) =>
              t.roomId &&
              (!t.room || t.room.code === undefined || t.room.floor === undefined)
          )
          .map((t) => t.roomId),
      ),
    ]

    if (roomIds.length === 0) return ticketsList

    const roomMap = {}
    await Promise.all(
      roomIds.map(async (roomId) => {
        try {
          const res = await apiClient.get(`/api/v1/rooms/${roomId}`)
          roomMap[roomId] = res?.data || res
        } catch (err) {
          console.error('Failed to fetch room detail', roomId, err)
        }
      }),
    )

    return ticketsList.map((ticket) => {
      const roomDetail = ticket.roomId ? roomMap[ticket.roomId] : null
      if (!roomDetail) return ticket
      return {
        ...ticket,
        room: {
          ...(ticket.room || {}),
          ...roomDetail,
        },
      }
    })
  }, [])

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/v1/tickets/my-tickets')
      const ticketsData = response?.data || {}
      const ticketsList = Array.isArray(ticketsData)
        ? ticketsData
        : Object.values(ticketsData).filter(Boolean)
      const hydratedTickets = await fetchRoomsForTickets(ticketsList)
      setTickets(hydratedTickets)
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to load tickets')
      console.error('Failed to load tickets:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchRoomsForTickets])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Listen for new ticket created events (real-time update)
  useEffect(() => {
    // Listen for custom window event (from CreateTicket)
    const handleTicketCreated = async (event) => {
      const newTicket = event.detail
      if (!newTicket || !newTicket.id) return

      try {
        // Fetch full ticket details including room, categories, etc.
        const ticketRes = await apiClient.get(`/api/v1/tickets/${newTicket.id}`)
        const fullTicket = ticketRes?.data || ticketRes

        // Fetch room details if needed
        if (fullTicket.roomId && (!fullTicket.room?.code || !fullTicket.room?.floor)) {
          try {
            const roomRes = await apiClient.get(`/api/v1/rooms/${fullTicket.roomId}`)
            fullTicket.room = roomRes.data || roomRes
          } catch (err) {
            console.error(`Failed to fetch room ${fullTicket.roomId}:`, err)
          }
        }

        // Check if ticket already exists (avoid duplicates)
        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === fullTicket.id)
          if (exists) return prevTickets
          
          // Add new ticket to the beginning of the list
          return [fullTicket, ...prevTickets]
        })
      } catch (err) {
        console.error('Failed to fetch new ticket details:', err)
        // Fallback: just add the ticket as-is
        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === newTicket.id)
          if (exists) return prevTickets
          return [newTicket, ...prevTickets]
        })
      }
    }

    // Listen for socket event from server (if server emits ticket:created)
    const handleSocketTicketCreated = async (ticketData) => {
      if (!ticketData || !ticketData.id) return

      try {
        // Fetch full ticket details
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketData.id}`)
        const fullTicket = ticketRes?.data || ticketRes

        // Fetch room details if needed
        if (fullTicket.roomId && (!fullTicket.room?.code || !fullTicket.room?.floor)) {
          try {
            const roomRes = await apiClient.get(`/api/v1/rooms/${fullTicket.roomId}`)
            fullTicket.room = roomRes.data || roomRes
          } catch (err) {
            console.error(`Failed to fetch room ${fullTicket.roomId}:`, err)
          }
        }

        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === fullTicket.id)
          if (exists) return prevTickets
          return [fullTicket, ...prevTickets]
        })
      } catch (err) {
        console.error('Failed to fetch new ticket from socket:', err)
      }
    }

    // Register event listeners
    window.addEventListener('ticket:created', handleTicketCreated)
    
    if (socket) {
      socket.on('ticket:created', handleSocketTicketCreated)
    }

    return () => {
      window.removeEventListener('ticket:created', handleTicketCreated)
      if (socket) {
        socket.off('ticket:created', handleSocketTicketCreated)
      }
    }
  }, [socket])


  const formatRoom = (room) => {
    if (!room) return 'N/A'
    const name = room.name || ''
    const codePart = room.code ? `code (${room.code})` : ''
    const floorPart =
      room.floor !== undefined && room.floor !== null
        ? `Floor ${room.floor}`
        : ''
    if (!codePart && !floorPart) return name || 'N/A'
    return `${name}\n${[codePart, floorPart].filter(Boolean).join(' ')}`.trim()
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      open: 'New',
      assigned: 'Assigned',
      accepted: 'In Progress',
      in_progress: 'In Progress',
      denied: 'Denied',
      resolved: 'Resolved',
      closed: 'Closed',
      escalated: 'Escalated',
    }
    return statusMap[status] || status
  }


  const getCategoryNames = (ticketCategories) => {
    if (!ticketCategories || ticketCategories.length === 0) return 'N/A'
    return ticketCategories.map((tc) => tc.category?.name || 'Unknown').join(', ')
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      !searchTerm ||
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.room?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.room?.code?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      !categoryFilter ||
      ticket.ticketCategories?.some(
        (tc) => tc.category?.name === categoryFilter
      )

    const matchesStatus =
      !statusFilter || getStatusLabel(ticket.status) === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const allCategories = [
    ...new Set(
      tickets.flatMap((t) =>
        t.ticketCategories?.map((tc) => tc.category?.name).filter(Boolean)
      )
    ),
  ]


  const openImagePopup = (attachment) => {
    setImagePopup(attachment)
  }

  const closeImagePopup = () => {
    setImagePopup(null)
  }

  const handleDeleteTicket = async (ticketId) => {
    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`)
      setTickets(tickets.filter(t => t.id !== ticketId))
      setError('')
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete ticket')
      console.error('Failed to delete ticket:', err)
      throw err
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            My Tickets
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            View and track your submitted tickets
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#991b1b'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        <div>
          {/* Left Panel - Table */}
          <div>
            {/* Filter Bar */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.25rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <input
                  type="text"
                  placeholder="Search by title or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: 'rgba(255, 255, 255, 0.72)',
                    color: '#374151',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '14px',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                    e.target.style.borderColor = 'rgba(99, 102, 241, 0.3)'
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                    e.target.style.borderColor = 'rgba(255,255,255,0.18)'
                  }}
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Categories</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Status</option>
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Denied">Denied</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  No tickets found
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{
                        backgroundColor: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb'
                      }}>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Title</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Category</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Room</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Created</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Due Date</th>
                        <th style={{
                          padding: '1rem',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket) => {
                        const statusColor = getStatusColor(ticket.status)
                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => navigate(`/student/tickets/${ticket.id}`)}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid #e5e7eb',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f9fafb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white'
                            }}
                          >
                            <td style={{
                              padding: '1rem',
                              fontSize: '0.875rem',
                              color: '#111827',
                              fontWeight: '500'
                            }}>{ticket.title}</td>
                            <td style={{
                              padding: '1rem',
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>{getCategoryNames(ticket.ticketCategories)}</td>
                            <td style={{
                              padding: '1rem',
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>
                              {formatRoom(ticket.room).split('\n').map((line, idx) => (
                                <span key={idx}>
                                  {line}
                                  {idx === 0 && <br />}
                                </span>
                              ))}
                            </td>
                            <td style={{
                              padding: '1rem',
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>{formatDate(ticket.createdAt)}</td>
                            <td style={{
                              padding: '1rem',
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>{formatDate(ticket.dueDate)}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                padding: '0.375rem 0.875rem',
                                borderRadius: '9999px',
                                backgroundColor: statusColor.bg,
                                color: statusColor.text,
                                border: `1px solid ${statusColor.border}`,
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                              }}>
                                {getStatusLabel(ticket.status)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={async () => {
            if (deleteConfirm) {
              try {
                await handleDeleteTicket(deleteConfirm.id)
                setDeleteConfirm(null)
              } catch (err) {
                // Error already handled in handleDeleteTicket
              }
            }
          }}
          deleting={false}
          title="Delete Ticket?"
          message={deleteConfirm ? `Are you sure you want to delete the ticket "${deleteConfirm.title}"?` : ''}
          warningMessage="This action cannot be undone."
          itemInfo={deleteConfirm ? {
            Title: deleteConfirm.title,
            ID: deleteConfirm.id,
          } : null}
          itemLabel="Ticket"
        />

        {/* Image Popup Modal */}
        {imagePopup && (
          <div
            onClick={closeImagePopup}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '2rem'
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeImagePopup}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '3rem',
                height: '3rem',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                lineHeight: '1'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              ×
            </button>

            {/* Image Container */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <img
                src={imagePopup.filePath}
                alt={imagePopup.fileName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              
              {/* Image Info */}
              <div style={{
                marginTop: '1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem'
                }}>
                  {imagePopup.fileName}
                </p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem'
                }}>
                  {(imagePopup.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                
                {/* Download Button */}
                <button
                  onClick={() => downloadFile(imagePopup.filePath, imagePopup.fileName)}
                  style={{
                    display: 'inline-block',
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }}
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyTickets
