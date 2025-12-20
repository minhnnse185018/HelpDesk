import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import {
  formatDate,
  getStatusBadge,
  getPriorityBadge,
} from "../../utils/ticketHelpers.jsx";
import AssignTicketModal from "../../components/modals/AssignTicketModal";
import NotificationModal from "../../components/modals/NotificationModal";
import { useNotificationSocket } from "../../context/NotificationSocketContext";


// Helper function to fetch room details
const fetchRoomDetails = async (roomId) => {
  try {
    const roomRes = await apiClient.get(`/api/v1/rooms/${roomId}`);
    return roomRes.data || roomRes;
  } catch (err) {
    console.error(`Failed to fetch room ${roomId}:`, err);
    return null;
  }
};

// Helper function to enrich ticket with room data
const enrichTicketWithRoom = async (ticket) => {
  if (ticket.roomId && (!ticket.room?.code || !ticket.room?.floor)) {
    const roomData = await fetchRoomDetails(ticket.roomId);
    if (roomData) {
      ticket.room = roomData;
    }
  }
  return ticket;
};


function AllTickets({ searchTerm = "" }) {
  const navigate = useNavigate();
  const { socket } = useNotificationSocket();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);

  const handleSortByPriority = useCallback(() => {
    const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    setTickets((prevTickets) => {
      const sorted = [...prevTickets].sort((a, b) => {
        const aVal = priorityMap[a.priority] || 0;
        const bVal = priorityMap[b.priority] || 0;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
      return sorted;
    });
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, [sortOrder]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/api/v1/tickets");
      let data = res?.data || res;

      if (data && !Array.isArray(data)) {
        data = Object.values(data).filter(Boolean);
      }

      let ticketsArray = Array.isArray(data) ? data : [];

      // Fetch tickets with subTickets to enrich the data
      try {
        const subTicketsRes = await apiClient.get("/api/v1/tickets/with-subtickets");
        const subTicketsData = subTicketsRes?.data || subTicketsRes;
        const ticketsWithSubTickets = Array.isArray(subTicketsData)
          ? subTicketsData
          : Object.values(subTicketsData || {}).filter(Boolean);

        // Create a map of ticket IDs to their subTickets
        const subTicketsMap = new Map();
        ticketsWithSubTickets.forEach((ticket) => {
          if (ticket.id && ticket.subTickets && Array.isArray(ticket.subTickets) && ticket.subTickets.length > 0) {
            subTicketsMap.set(ticket.id, ticket.subTickets);
          }
        });

        // Merge subTickets into tickets array
        ticketsArray = ticketsArray.map((ticket) => {
          if (subTicketsMap.has(ticket.id)) {
            return { ...ticket, subTickets: subTicketsMap.get(ticket.id) };
          }
          return ticket;
        });
      } catch (err) {
        console.error("Failed to fetch tickets with subTickets:", err);
        // Continue without subTickets data
      }

      // Fetch room details for tickets with incomplete room data
      ticketsArray = await Promise.all(
        ticketsArray.map(enrichTicketWithRoom)
      );

      setTickets(ticketsArray);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load tickets. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();

    // Auto-refresh every 5 minutes (300000ms)
    const interval = setInterval(loadTickets, 300000);

    // Refresh when tab becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTickets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadTickets]);

  // Helper function to add ticket to list (avoid duplicates)
  const addTicketToList = useCallback(async (ticketData, fetchFullDetails = true) => {
    if (!ticketData || !ticketData.id) return;

    try {
      let fullTicket = ticketData;
      
      if (fetchFullDetails) {
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketData.id}`);
        fullTicket = ticketRes?.data || ticketRes;
        await enrichTicketWithRoom(fullTicket);
      }

      setTickets((prevTickets) => {
        const exists = prevTickets.some(t => t.id === fullTicket.id);
        if (exists) return prevTickets;
        return [fullTicket, ...prevTickets];
      });
    } catch (err) {
      console.error('Failed to add ticket to list:', err);
      // Fallback: add ticket as-is if fetch failed
      if (fetchFullDetails) {
        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === ticketData.id);
          if (exists) return prevTickets;
          return [ticketData, ...prevTickets];
        });
      }
    }
  }, []);

  // Listen for ticket events (real-time update)
  useEffect(() => {
    // Listen for custom window event (from CreateTicket)
    const handleTicketCreated = (event) => {
      addTicketToList(event.detail, true);
    };

    // Listen for ticket assigned event
    const handleTicketAssigned = (event) => {
      const updatedTicket = event.detail;
      if (!updatedTicket?.id) return;
      
      setTickets((prevTickets) => 
        prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t)
      );
    };

    // Listen for socket event from server
    const handleSocketTicketCreated = (ticketData) => {
      addTicketToList(ticketData, true);
    };

    // Register event listeners
    window.addEventListener('ticket:created', handleTicketCreated);
    window.addEventListener('ticket:assigned', handleTicketAssigned);
    
    if (socket) {
      socket.on('ticket:created', handleSocketTicketCreated);
    }

    return () => {
      window.removeEventListener('ticket:created', handleTicketCreated);
      window.removeEventListener('ticket:assigned', handleTicketAssigned);
      if (socket) {
        socket.off('ticket:created', handleSocketTicketCreated);
      }
    };
  }, [socket, addTicketToList]);

  const handleDeleteClick = useCallback((ticketId) => {
    setDeleteConfirmModal(ticketId);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const ticketId = deleteConfirmModal;
    if (!ticketId) return;
    
    setDeleteConfirmModal(null);

    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`);
      setNotification({ type: "success", message: "Ticket deleted successfully!" });
      loadTickets();
    } catch (err) {
      console.error("Failed to delete:", err);
      setNotification({ type: "error", message: "Failed to delete ticket" });
    }
  }, [deleteConfirmModal, loadTickets]);

  const handleAssign = useCallback(async (ticketId, staffId, priority) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, {
        staffId,
        priority,
      });
      
      // Fetch updated ticket to emit with event
      try {
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketId}`);
        const updatedTicket = ticketRes?.data || ticketRes;
        await enrichTicketWithRoom(updatedTicket);
        
        // Emit event for real-time update
        window.dispatchEvent(new CustomEvent('ticket:assigned', { 
          detail: updatedTicket 
        }));
      } catch (fetchErr) {
        console.error('Failed to fetch updated ticket:', fetchErr);
      }
      
      setNotification({
        type: "success",
        message: "Ticket assigned successfully!",
      });
      setAssignModal(null);
      loadTickets();
    } catch (err) {
      console.error("Failed to assign:", err);
      console.error("Error details:", err.response?.data);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to assign ticket",
      });
    }
  }, [loadTickets]);

  // Filter tickets based on search term - memoized
  const filteredTickets = useMemo(() => {
    if (!searchTerm) return tickets;
    const searchLower = searchTerm.toLowerCase();
    return tickets.filter((ticket) => (
      ticket.title?.toLowerCase().includes(searchLower) ||
      ticket.room?.name?.toLowerCase().includes(searchLower) ||
      ticket.room?.code?.toLowerCase().includes(searchLower) ||
      ticket.department?.name?.toLowerCase().includes(searchLower) ||
      ticket.assignee?.username?.toLowerCase().includes(searchLower) ||
      ticket.assignee?.fullName?.toLowerCase().includes(searchLower) ||
      ticket.status?.toLowerCase().includes(searchLower) ||
      ticket.priority?.toLowerCase().includes(searchLower)
    ));
  }, [tickets, searchTerm]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          borderRadius: "16px",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "3px solid rgba(0,0,0,0.1)",
              borderTopColor: "#000",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#6b7280", margin: 0 }}>Loading tickets...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          backgroundColor: "#fee2e2",
          borderRadius: "12px",
          color: "#dc2626",
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 1024px) {
            .ticket-table th:nth-child(5),
            .ticket-table td:nth-child(5),
            .ticket-table th:nth-child(6),
            .ticket-table td:nth-child(6),
            .ticket-table th:nth-child(8),
            .ticket-table td:nth-child(8) {
              display: none;
            }
          }
          
          @media (max-width: 768px) {
            .ticket-table th:nth-child(4),
            .ticket-table td:nth-child(4),
            .ticket-table th:nth-child(7),
            .ticket-table td:nth-child(7) {
              display: none;
            }
            
            .ticket-table th,
            .ticket-table td {
              padding: 0.75rem 0.5rem !important;
              font-size: 0.8rem !important;
            }
            
            .ticket-actions {
              flex-wrap: wrap !important;
              gap: 0.25rem !important;
            }
            
            .ticket-actions button {
              padding: 0.375rem 0.75rem !important;
              font-size: 0.75rem !important;
            }
          }
          
          @media (max-width: 640px) {
            .ticket-table th:nth-child(3),
            .ticket-table td:nth-child(3) {
              display: none;
            }
            
            .ticket-table {
              font-size: 0.75rem !important;
            }
            
            .ticket-table th,
            .ticket-table td {
              padding: 0.5rem 0.375rem !important;
            }
            
            .ticket-title {
              font-size: 0.875rem !important;
            }
          }
        `}
      </style>
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table
            className="ticket-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(249, 250, 251, 0.5)",
                  borderBottom: "1px solid rgba(229,231,235,0.6)",
                }}
              >
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    minWidth: "200px",
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSortByPriority}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                      padding: 0,
                    }}
                  >
                    Priority
                    <span style={{ fontSize: "0.7rem" }}>
                      {sortOrder === "asc" ? "▲" : "▼"}
                    </span>
                  </button>
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Room
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Department
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    width:"120px",
                    minWidth:"120px"
                  }}
                >
                  Categories
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Assignee
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Created At
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      {searchTerm
                        ? `No tickets found matching "${searchTerm}"`
                        : "No tickets found"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ 
                      borderBottom: "1px solid #f3f4f6",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                        <div
                          className="ticket-title"
                          style={{
                            color: "#111827",
                            fontWeight: 500,
                          }}
                        >
                          {ticket.title}
                        </div>
                        {/* Badge SUB-TICKET */}
                        {ticket.subTickets && Array.isArray(ticket.subTickets) && ticket.subTickets.length > 0 && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              padding: "0.125rem 0.5rem",
                              borderRadius: "9999px",
                              backgroundColor: "#dbeafe",
                              color: "#1e40af",
                              whiteSpace: "nowrap",
                            }}
                          >
                            SUB-TICKET
                          </span>
                        )}
                        {/* Badge PENDING SPLIT - chỉ hiển thị khi chưa có subTickets */}
                        {ticket.status === "open" &&
                          Array.isArray(ticket.ticketCategories) &&
                          ticket.ticketCategories.length >= 2 &&
                          (!ticket.subTickets || !Array.isArray(ticket.subTickets) || ticket.subTickets.length === 0) && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                padding: "0.125rem 0.5rem",
                                borderRadius: "9999px",
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                whiteSpace: "nowrap",
                              }}
                            >
                              PENDING SPLIT
                            </span>
                          )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginTop: "0.25rem",
                        }}
                      >
                        Created by:{" "}
                        {ticket.creator?.username ||
                          ticket.creator?.email ||
                          "N/A"}
                      </div>
                      {ticket.deniedReason && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#dc2626",
                            backgroundColor: "#fee2e2",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            marginTop: "0.5rem",
                          }}
                        >
                          <strong>Denied:</strong> {ticket.deniedReason}
                        </div>
                      )}
                      {ticket.status === "resolved" &&
                        ticket.resolutionNote && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#166534",
                              backgroundColor: "#dcfce7",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              marginTop: "0.5rem",
                            }}
                          >
                            <strong>Resolution:</strong> {ticket.resolutionNote}
                          </div>
                        )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {ticket.room ? (
                        <div>
                          <div style={{ fontWeight: 500, color: "#111827", whiteSpace: "nowrap" }}>
                            {ticket.room.name || "N/A"}
                          </div>
                          {(ticket.room.code || ticket.room.floor) && (
                            <div style={{ fontSize: "0.75rem", marginTop: "0.125rem", whiteSpace: "nowrap" }}>
                              {ticket.room.code && `(${ticket.room.code})`}
                              {ticket.room.code && ticket.room.floor && " - "}
                              {ticket.room.floor && `Floor ${ticket.room.floor}`}
                            </div>
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {ticket.department ? (
                        <div>
                          <div style={{ fontWeight: 500, color: "#6b7280" }}>
                            {ticket.department.name || "N/A"}
                          </div>
                          {ticket.department.code && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                marginTop: "0.125rem",
                              }}
                            >
                              ({ticket.department.code})
                            </div>
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#6b7280",
                        fontSize: "0.8rem",
                      }}
                    >
                      {Array.isArray(ticket.ticketCategories) &&
                      ticket.ticketCategories.length > 0
                        ? ticket.ticketCategories
                            .map((tc) => tc.category?.name)
                            .filter(Boolean)
                            .join(", ")
                        : "N/A"}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      <div style={{ fontWeight: 500, color: "#6b7280" }}>
                        {ticket.assignee?.username || "N/A"}
                      </div>
                      {ticket.assignee?.fullName && (
                        <div style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
                          {ticket.assignee.fullName}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#6b7280",
                        fontSize: "0.8rem",
                      }}
                    >
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td 
                      style={{ padding: "0.75rem", position: "relative" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "nowrap" }}>
                        {ticket.status !== "in_progress" &&
                          ticket.status !== "closed" &&
                          ticket.status !== "escalated" && (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/tickets/edit/${ticket.id}`)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                backgroundColor: "rgba(59, 130, 246, 0.08)",
                                color: "#2563eb",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.08)";
                              }}
                            >
                              Edit
                            </button>
                          )}
                        {(() => {
                          const canAssign = ticket.status === "open";
                          const isPendingSplit = ticket.status === "open" &&
                            Array.isArray(ticket.ticketCategories) &&
                            ticket.ticketCategories.length >= 2;
                          
                          if (!canAssign || isPendingSplit) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => setAssignModal(ticket)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                backgroundColor: "rgba(16, 185, 129, 0.08)",
                                color: "#10b981",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(16, 185, 129, 0.08)";
                              }}
                            >
                              Assign
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(ticket.id)}
                          style={{
                            padding: "0.375rem 0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            color: "#dc2626",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {assignModal && (
        <AssignTicketModal
          ticket={assignModal}
          onClose={() => setAssignModal(null)}
          onSubmit={handleAssign}
        />
      )}

      {notification && (
        <NotificationModal
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {deleteConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirmModal(null)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "1rem",
              }}
            >
              Confirm Delete
            </h3>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "1.5rem",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to delete this ticket? This action cannot be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#e5e7eb";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#ef4444";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AllTickets;
