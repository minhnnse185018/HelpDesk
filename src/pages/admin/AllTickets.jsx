import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import {
  formatDate,
} from "../../utils/ticketHelpers.jsx";
import AssignTicketModal from "../../components/modals/AssignTicketModal";
import NotificationModal from "../../components/modals/NotificationModal";
import { useNotificationSocket } from "../../context/NotificationSocketContext";

const getStatusColor = (status) => {
  const colors = {
    open: { bg: "#e0e7ff", text: "#3730a3" },
    assigned: { bg: "#dbeafe", text: "#1e40af" },
    in_progress: { bg: "#fef3c7", text: "#92400e" },
    resolved: { bg: "#d1fae5", text: "#065f46" },
    denied: { bg: "#fee2e2", text: "#991b1b" },
    closed: { bg: "#e5e7eb", text: "#374151" },
    escalated: { bg: "#fef2f2", text: "#b91c1c" },
  };
  return colors[status] || { bg: "#f3f4f6", text: "#374151" };
};

const getPriorityColor = (priority) => {
  const colors = {
    low: { bg: "#dbeafe", text: "#1e40af" },
    medium: { bg: "#fef3c7", text: "#92400e" },
    high: { bg: "#fed7aa", text: "#9a3412" },
    critical: { bg: "#fecaca", text: "#991b1b" },
  };
  return colors[priority] || { bg: "#f3f4f6", text: "#374151" };
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

  const handleSortByPriority = () => {
    const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const sorted = [...tickets].sort((a, b) => {
      const aVal = priorityMap[a.priority] || 0;
      const bVal = priorityMap[b.priority] || 0;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
    setTickets(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const loadTickets = async () => {
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
        ticketsArray.map(async (ticket) => {
          if (ticket.roomId && (!ticket.room?.code || !ticket.room?.floor)) {
            try {
              const roomRes = await apiClient.get(
                `/api/v1/rooms/${ticket.roomId}`
              );
              ticket.room = roomRes.data || roomRes;
            } catch (err) {
              console.error(`Failed to fetch room ${ticket.roomId}:`, err);
            }
          }
          return ticket;
        })
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
  };

  useEffect(() => {
    loadTickets();

    // Auto-refresh every 5 minutes (300000ms)
    const interval = setInterval(() => {
      loadTickets();
    }, 300000); // 5 minutes

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
  }, []);

  // Listen for new ticket created events (real-time update)
  useEffect(() => {
    // Listen for custom window event (from CreateTicket)
    const handleTicketCreated = async (event) => {
      const newTicket = event.detail;
      if (!newTicket || !newTicket.id) return;

      try {
        // Fetch full ticket details including room, categories, etc.
        const ticketRes = await apiClient.get(`/api/v1/tickets/${newTicket.id}`);
        const fullTicket = ticketRes?.data || ticketRes;

        // Fetch room details if needed
        if (fullTicket.roomId && (!fullTicket.room?.code || !fullTicket.room?.floor)) {
          try {
            const roomRes = await apiClient.get(`/api/v1/rooms/${fullTicket.roomId}`);
            fullTicket.room = roomRes.data || roomRes;
          } catch (err) {
            console.error(`Failed to fetch room ${fullTicket.roomId}:`, err);
          }
        }

        // Check if ticket already exists (avoid duplicates)
        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === fullTicket.id);
          if (exists) return prevTickets;
          
          // Add new ticket to the beginning of the list
          return [fullTicket, ...prevTickets];
        });
      } catch (err) {
        console.error('Failed to fetch new ticket details:', err);
        // Fallback: just add the ticket as-is
        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === newTicket.id);
          if (exists) return prevTickets;
          return [newTicket, ...prevTickets];
        });
      }
    };

    // Listen for socket event from server (if server emits ticket:created)
    const handleSocketTicketCreated = async (ticketData) => {
      if (!ticketData || !ticketData.id) return;

      try {
        // Fetch full ticket details
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketData.id}`);
        const fullTicket = ticketRes?.data || ticketRes;

        // Fetch room details if needed
        if (fullTicket.roomId && (!fullTicket.room?.code || !fullTicket.room?.floor)) {
          try {
            const roomRes = await apiClient.get(`/api/v1/rooms/${fullTicket.roomId}`);
            fullTicket.room = roomRes.data || roomRes;
          } catch (err) {
            console.error(`Failed to fetch room ${fullTicket.roomId}:`, err);
          }
        }

        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === fullTicket.id);
          if (exists) return prevTickets;
          return [fullTicket, ...prevTickets];
        });
      } catch (err) {
        console.error('Failed to fetch new ticket from socket:', err);
      }
    };

    // Listen for ticket assigned events (real-time update)
    const handleTicketAssigned = async (event) => {
      const updatedTicket = event.detail;
      if (!updatedTicket || !updatedTicket.id) return;

      try {
        // Fetch full ticket details including room, categories, etc.
        const ticketRes = await apiClient.get(`/api/v1/tickets/${updatedTicket.id}`);
        const fullTicket = ticketRes?.data || ticketRes;

        // Fetch room details if needed
        if (fullTicket.roomId && (!fullTicket.room?.code || !fullTicket.room?.floor)) {
          try {
            const roomRes = await apiClient.get(`/api/v1/rooms/${fullTicket.roomId}`);
            fullTicket.room = roomRes.data || roomRes;
          } catch (err) {
            console.error(`Failed to fetch room ${fullTicket.roomId}:`, err);
          }
        }

        // Update existing ticket in the list
        setTickets((prevTickets) => {
          return prevTickets.map((ticket) =>
            ticket.id === fullTicket.id ? fullTicket : ticket
          );
        });
      } catch (err) {
        console.error('Failed to fetch assigned ticket details:', err);
        // Fallback: update with the ticket from event if fetch fails
        setTickets((prevTickets) => {
          return prevTickets.map((ticket) =>
            ticket.id === updatedTicket.id ? updatedTicket : ticket
          );
        });
      }
    };

    // Listen for socket event from server (if server emits ticket:assigned)
    const handleSocketTicketAssigned = async (ticketData) => {
      if (!ticketData || !ticketData.id) return;

      try {
        // Fetch full ticket details
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketData.id}`);
        const fullTicket = ticketRes?.data || ticketRes;

        // Fetch room details if needed
        if (fullTicket.roomId && (!fullTicket.room?.code || !fullTicket.room?.floor)) {
          try {
            const roomRes = await apiClient.get(`/api/v1/rooms/${fullTicket.roomId}`);
            fullTicket.room = roomRes.data || roomRes;
          } catch (err) {
            console.error(`Failed to fetch room ${fullTicket.roomId}:`, err);
          }
        }

        // Update existing ticket in the list
        setTickets((prevTickets) => {
          return prevTickets.map((ticket) =>
            ticket.id === fullTicket.id ? fullTicket : ticket
          );
        });
      } catch (err) {
        console.error('Failed to fetch assigned ticket from socket:', err);
      }
    };

    // Register event listeners
    window.addEventListener('ticket:created', handleTicketCreated);
    window.addEventListener('ticket:assigned', handleTicketAssigned);
    
    if (socket) {
      socket.on('ticket:created', handleSocketTicketCreated);
      socket.on('ticket:assigned', handleSocketTicketAssigned);
    }

    return () => {
      window.removeEventListener('ticket:created', handleTicketCreated);
      window.removeEventListener('ticket:assigned', handleTicketAssigned);
      if (socket) {
        socket.off('ticket:created', handleSocketTicketCreated);
        socket.off('ticket:assigned', handleSocketTicketAssigned);
      }
    };
  }, [socket]);

  const handleDeleteClick = (ticketId) => {
    setDeleteConfirmModal(ticketId);
  };

  const handleDeleteConfirm = async () => {
    const ticketId = deleteConfirmModal;
    setDeleteConfirmModal(null);

    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`);
      setNotification({ type: "success", message: "Ticket deleted successfully!" });
      loadTickets();
    } catch (err) {
      console.error("Failed to delete:", err);
      setNotification({ type: "error", message: "Failed to delete ticket" });
    }
  };

  const handleAssign = async (ticketId, staffId, priority) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, {
        staffId,
        priority,
      });
      
      // Wait a bit for database transaction to complete and socket to emit
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch updated ticket to emit with event
      try {
        const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketId}`);
        const updatedTicket = ticketRes?.data || ticketRes;

        // Verify status was updated
        if (updatedTicket.status === 'assigned') {
          // Fetch room details if needed
          if (updatedTicket.roomId && (!updatedTicket.room?.code || !updatedTicket.room?.floor)) {
            try {
              const roomRes = await apiClient.get(`/api/v1/rooms/${updatedTicket.roomId}`);
              updatedTicket.room = roomRes.data || roomRes;
            } catch (err) {
              console.error(`Failed to fetch room ${updatedTicket.roomId}:`, err);
            }
          }
          
          // Update state directly with the updated ticket
          setTickets((prevTickets) => {
            return prevTickets.map((ticket) =>
              ticket.id === updatedTicket.id ? updatedTicket : ticket
            );
          });
          
          // Emit event for real-time update to other components
          window.dispatchEvent(new CustomEvent('ticket:assigned', { 
            detail: updatedTicket 
          }));
        } else {
          // Status not updated yet, reload all tickets
          console.warn('Ticket status not updated to assigned yet, reloading all tickets...');
          loadTickets();
        }
      } catch (fetchErr) {
        console.error('Failed to fetch updated ticket:', fetchErr);
        // Fallback: reload all tickets if fetch fails
        loadTickets();
      }
      
      setNotification({
        type: "success",
        message: "Ticket assigned successfully!",
      });
      setAssignModal(null);
    } catch (err) {
      console.error("Failed to assign:", err);
      console.error("Error details:", err.response?.data);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to assign ticket",
      });
    }
  };

  // Filter tickets based on search term
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.title?.toLowerCase().includes(searchLower) ||
      ticket.room?.name?.toLowerCase().includes(searchLower) ||
      ticket.room?.code?.toLowerCase().includes(searchLower) ||
      ticket.department?.name?.toLowerCase().includes(searchLower) ||
      ticket.assignee?.username?.toLowerCase().includes(searchLower) ||
      ticket.assignee?.fullName?.toLowerCase().includes(searchLower) ||
      ticket.status?.toLowerCase().includes(searchLower) ||
      ticket.priority?.toLowerCase().includes(searchLower)
    );
  });

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
                    padding: "1rem",
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
                    style={{ borderBottom: "1px solid #f3f4f6" }}
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
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          backgroundColor: getStatusColor(ticket.status).bg,
                          color: getStatusColor(ticket.status).text,
                        }}
                      >
                        {ticket.status?.toUpperCase() || "N/A"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          backgroundColor: getPriorityColor(ticket.priority).bg,
                          color: getPriorityColor(ticket.priority).text,
                        }}
                      >
                        {ticket.priority?.toUpperCase() || "N/A"}
                      </span>
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
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/tickets/${ticket.id}`)
                          }
                          style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            backgroundColor: "rgba(99, 102, 241, 0.08)",
                            color: "#6366f1",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            borderRadius: "14px",
                            cursor: "pointer",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            backdropFilter: "blur(40px) saturate(200%)",
                            boxShadow:
                              "0 8px 32px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(99, 102, 241, 0.1)",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(99, 102, 241, 0.15)";
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(99, 102, 241, 0.08)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          View
                        </button>
                        {ticket.status !== "in_progress" &&
                          ticket.status !== "closed" &&
                          ticket.status !== "escalated" && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/tickets/edit/${ticket.id}`)
                              }
                              style={{
                                padding: "0.5rem 1rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                backgroundColor: "rgba(59, 130, 246, 0.08)",
                                color: "#2563eb",
                                border: "1px solid rgba(59, 130, 246, 0.2)",
                                borderRadius: "14px",
                                cursor: "pointer",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                backdropFilter: "blur(40px) saturate(200%)",
                                boxShadow:
                                  "0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(59, 130, 246, 0.15)";
                                e.currentTarget.style.transform =
                                  "translateY(-1px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(59, 130, 246, 0.08)";
                                e.currentTarget.style.transform = "translateY(0)";
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
                          
                          // Ẩn nút Assign nếu ticket là pending split
                          if (!canAssign || isPendingSplit) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => setAssignModal(ticket)}
                              style={{
                                padding: "0.5rem 1rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                backgroundColor: "rgba(16, 185, 129, 0.08)",
                                color: "#10b981",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                borderRadius: "14px",
                                cursor: "pointer",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                backdropFilter: "blur(40px) saturate(200%)",
                                boxShadow:
                                  "0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(16, 185, 129, 0.15)";
                                e.currentTarget.style.transform =
                                  "translateY(-1px)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(16, 185, 129, 0.08)";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
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
                            padding: "0.5rem 1rem",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            color: "#dc2626",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "14px",
                            cursor: "pointer",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            backdropFilter: "blur(40px) saturate(200%)",
                            boxShadow:
                              "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(239, 68, 68, 0.15)";
                            e.currentTarget.style.transform =
                              "translateY(-1px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(239, 68, 68, 0.08)";
                            e.currentTarget.style.transform = "translateY(0)";
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
