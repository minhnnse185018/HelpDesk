import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../api/client'
import { ActionButton, DeleteConfirmModal } from '../../components/templates'

function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  const getStatusColor = (status) => {
    const statusColorMap = {
      open: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
      assigned: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      accepted: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
      in_progress: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
      denied: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
      resolved: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
      closed: { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' },
      escalated: { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' },
    }
    return statusColorMap[status] || statusColorMap.open
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

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket)
  }

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
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null)
      }
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedTicket ? '1fr 450px' : '1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
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
                        const isSelected = selectedTicket?.id === ticket.id
                        const statusColor = getStatusColor(ticket.status)
                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => handleSelectTicket(ticket)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #e5e7eb',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = 'white'
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
                                display: 'inline-block',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                borderRadius: '6px',
                                backgroundColor: statusColor.bg,
                                color: statusColor.text,
                                border: `1px solid ${statusColor.border}`
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

          {/* Right Panel - Detail */}
          {selectedTicket && (
            <div style={{
              position: 'sticky',
              top: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '1.5rem',
              maxHeight: 'calc(100vh - 4rem)',
              overflowY: 'auto'
            }}>
              {/* Close Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '0.25rem'
                  }}>
                    Ticket Details
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {selectedTicket.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem'
                  }}>Category</p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>{getCategoryNames(selectedTicket.ticketCategories)}</p>
                </div>
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem'
                  }}>Room</p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {formatRoom(selectedTicket.room).split('\n').map((line, idx) => (
                      <span key={idx}>
                        {line}
                        {idx === 0 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
                {selectedTicket.department && (
                  <div>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem'
                    }}>Department</p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>{selectedTicket.department.name}</p>
                  </div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem'
                    }}>Created</p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem'
                    }}>Due Date</p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>{formatDate(selectedTicket.dueDate)}</p>
                  </div>
                </div>
                <div>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem'
                  }}>Status</p>
                  {(() => {
                    const statusColor = getStatusColor(selectedTicket.status)
                    return (
                      <span style={{
                        display: 'inline-block',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '6px',
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`
                      }}>
                        {getStatusLabel(selectedTicket.status)}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Description */}
              <div style={{
                marginBottom: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '0.75rem'
                }}>Description</h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}>
                  {selectedTicket.description || 'No description provided'}
                </p>
              </div>

              {/* Attachments - Grid Layout */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div style={{
                  marginBottom: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.75rem'
                  }}>Attachments ({selectedTicket.attachments.length})</h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {selectedTicket.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        onClick={() => openImagePopup(attachment)}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <img
                          src={attachment.filePath}
                          alt={attachment.fileName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          color: 'white',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.625rem',
                          fontWeight: '600'
                        }}>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tickets */}
              {Array.isArray(selectedTicket.subTickets) && selectedTicket.subTickets.length > 0 && (
                <div style={{
                  marginBottom: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.75rem'
                  }}>
                    Sub-tickets ({selectedTicket.subTickets.length})
                  </h4>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignee</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved At</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolution Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTicket.subTickets.map((subTicket) => {
                          const statusColor = getStatusColor(subTicket.status)
                          return (
                            <tr key={subTicket.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                                {subTicket.category?.name || 'N/A'}
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {subTicket.assignee?.username || subTicket.assignee?.email || 'Unassigned'}
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {subTicket.priority ? subTicket.priority.toUpperCase() : '-'}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '0.35rem 0.7rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  borderRadius: '6px',
                                  backgroundColor: statusColor.bg,
                                  color: statusColor.text,
                                  border: `1px solid ${statusColor.border}`
                                }}>
                                  {getStatusLabel(subTicket.status)}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {formatDate(subTicket.dueDate)}
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {formatDate(subTicket.resolvedAt)}
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                {subTicket.resolutionNote || '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem'
                }}>Timeline</h4>
                <div style={{ position: 'relative' }}>
                  {/* Timeline Items */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {/* Created */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        marginTop: '0.375rem',
                        flexShrink: 0
                      }} />
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#111827'
                        }}>Ticket Created</p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginTop: '0.125rem'
                        }}>
                          {formatDate(selectedTicket.createdAt)} · {selectedTicket.creator?.username || selectedTicket.creator?.email}
                        </p>
                      </div>
                    </div>

                    {/* Assigned */}
                    {selectedTicket.assignedAt && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#f59e0b',
                          marginTop: '0.375rem',
                          flexShrink: 0
                        }} />
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#111827'
                          }}>Assigned</p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.125rem'
                          }}>
                            {formatDate(selectedTicket.assignedAt)} · {selectedTicket.assignee?.username || selectedTicket.assignee?.email || 'System'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Accepted */}
                    {selectedTicket.acceptedAt && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#6366f1',
                          marginTop: '0.375rem',
                          flexShrink: 0
                        }} />
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#111827'
                          }}>Accepted</p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.125rem'
                          }}>
                            {formatDate(selectedTicket.acceptedAt)} · {selectedTicket.assignee?.username || selectedTicket.assignee?.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Started */}
                    {selectedTicket.startedAt && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#8b5cf6',
                          marginTop: '0.375rem',
                          flexShrink: 0
                        }} />
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#111827'
                          }}>Started</p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.125rem'
                          }}>
                            {formatDate(selectedTicket.startedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Resolved */}
                    {selectedTicket.resolvedAt && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          marginTop: '0.375rem',
                          flexShrink: 0
                        }} />
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#111827'
                          }}>Resolved</p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.125rem'
                          }}>
                            {formatDate(selectedTicket.resolvedAt)}
                          </p>
                          {selectedTicket.resolutionNote && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#374151',
                              marginTop: '0.25rem',
                              fontStyle: 'italic'
                            }}>
                              {selectedTicket.resolutionNote}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Closed */}
                    {selectedTicket.closedAt && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#6b7280',
                          marginTop: '0.375rem',
                          flexShrink: 0
                        }} />
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#111827'
                          }}>Closed</p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.125rem'
                          }}>
                            {formatDate(selectedTicket.closedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Denied */}
                    {selectedTicket.status === 'denied' && selectedTicket.deniedReason && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          marginTop: '0.375rem',
                          flexShrink: 0
                        }} />
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#111827'
                          }}>Denied</p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.125rem'
                          }}>
                            Reason: {selectedTicket.deniedReason}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <ActionButton
                variant="danger"
                onClick={() => setDeleteConfirm(selectedTicket)}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                }}
              >
                Delete Ticket
              </ActionButton>
            </div>
          )}
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
          message={`Are you sure you want to delete the ticket "${deleteConfirm?.title}"?`}
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
                <a
                  href={imagePopup.filePath}
                  download={imagePopup.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
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
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyTickets
