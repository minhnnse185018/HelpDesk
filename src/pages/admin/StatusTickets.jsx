import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { formatDate, getPriorityBadge, getStatusBadge } from "../../utils/ticketHelpers.jsx";
import AssignTicketModal from "../../components/modals/AssignTicketModal";
import { ActionButton, AlertModal } from "../../components/templates";
import { useNotificationSocket } from "../../context/NotificationSocketContext";

function StatusTickets({ status, searchTerm = "" }) {
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

      // Filter by status
      if (status) {
        ticketsArray = ticketsArray.filter((ticket) => ticket.status === status);
      }
      
      // Fetch room details for tickets with incomplete room data
      ticketsArray = await Promise.all(
        ticketsArray.map(async (ticket) => {
          if (ticket.roomId && (!ticket.room?.code || !ticket.room?.floor)) {
            try {
              const roomRes = await apiClient.get(`/api/v1/rooms/${ticket.roomId}`);
              ticket.room = roomRes.data || roomRes;
            } catch (err) {
              console.error(`Failed to fetch room ${ticket.roomId}:`, err);
            }
          }
          return ticket;
        })
      );

      // Merge với local state: giữ lại ticket có status "assigned" từ local state nếu server trả về "open"
      // (tránh trường hợp server chưa cập nhật kịp)
      setTickets((prevTickets) => {
        const prevTicketsMap = new Map(prevTickets.map(t => [t.id, t]));
        const mergedTickets = ticketsArray.map(serverTicket => {
          const localTicket = prevTicketsMap.get(serverTicket.id);
          
          // Nếu local ticket có status "assigned" và server trả về "open" nhưng có assignee
          // => có thể server chưa cập nhật kịp, giữ lại status "assigned" từ local
          if (localTicket && 
              localTicket.status === "assigned" && 
              serverTicket.status === "open" &&
              (serverTicket.assigneeId || serverTicket.assignee)) {
            return { ...serverTicket, status: "assigned" };
          }
          
          return serverTicket;
        });
        
        // Thêm các ticket từ local state không có trong server response (nếu phù hợp filter)
        prevTickets.forEach(localTicket => {
          const existsInServer = mergedTickets.some(t => t.id === localTicket.id);
          if (!existsInServer && (!status || localTicket.status === status)) {
            mergedTickets.push(localTicket);
          }
        });
        
        return mergedTickets;
      });
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    
    // Auto-refresh every 5 minutes (300000ms) - giảm tần suất vì đã có socket
    const interval = setInterval(() => {
      loadTickets();
    }, 300000);
    
    return () => clearInterval(interval);
  }, [status]);

  // Helper function to update ticket in list (handles all status changes)
  const updateTicketInList = async (ticketData, fetchFullDetails = true) => {
    if (!ticketData || !ticketData.id) return;

    try {
      let updatedTicket = ticketData;
      
      if (fetchFullDetails) {
        try {
          const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketData.id}`);
          updatedTicket = ticketRes?.data || ticketRes;
        } catch (fetchErr) {
          console.error('Failed to fetch ticket details:', fetchErr);
          updatedTicket = ticketData;
        }
      }
      
      // Fetch room details if needed
      if (updatedTicket.roomId && (!updatedTicket.room?.code || !updatedTicket.room?.floor)) {
        try {
          const roomRes = await apiClient.get(`/api/v1/rooms/${updatedTicket.roomId}`);
          updatedTicket.room = roomRes.data || roomRes;
        } catch (err) {
          console.error(`Failed to fetch room ${updatedTicket.roomId}:`, err);
        }
      }
      
      setTickets((prevTickets) => {
        const existingTicket = prevTickets.find(t => t.id === updatedTicket.id);
        
        // Preserve status "assigned" nếu local state đã có và server chưa cập nhật kịp
        // Với các status khác, luôn trust server data
        if (existingTicket && 
            existingTicket.status === "assigned" && 
            updatedTicket.status === "open" &&
            (updatedTicket.assigneeId || updatedTicket.assignee)) {
          updatedTicket.status = "assigned";
        }
        
        // Chỉ cập nhật nếu ticket phù hợp với status filter
        if (status && updatedTicket.status !== status) {
          // Nếu ticket không còn phù hợp với filter, xóa khỏi danh sách
          return prevTickets.filter(t => t.id !== updatedTicket.id);
        }
        
        const exists = prevTickets.some(t => t.id === updatedTicket.id);
        if (exists) {
          return prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
        }
        // Nếu ticket mới và phù hợp với filter, thêm vào danh sách
        if (!status || updatedTicket.status === status) {
          return [updatedTicket, ...prevTickets];
        }
        return prevTickets;
      });
    } catch (err) {
      console.error('Failed to update ticket in list:', err);
    }
  };

  // Listen for ticket events (real-time update via socket và window events)
  useEffect(() => {
    // Generic handler for all ticket updates
    const handleTicketUpdated = async (event) => {
      const updatedTicket = event.detail;
      if (!updatedTicket?.id) return;
      await updateTicketInList(updatedTicket, true);
    };

    // Generic handler for socket ticket updates
    const handleSocketTicketUpdated = async (ticketData) => {
      if (!ticketData?.id) return;
      await updateTicketInList(ticketData, true);
    };

    // Register event listeners for all ticket update events
    window.addEventListener('ticket:assigned', handleTicketUpdated);
    window.addEventListener('ticket:accepted', handleTicketUpdated);
    window.addEventListener('ticket:updated', handleTicketUpdated);
    window.addEventListener('ticket:resolved', handleTicketUpdated);
    window.addEventListener('ticket:denied', handleTicketUpdated);
    window.addEventListener('ticket:closed', handleTicketUpdated);
    
    if (socket) {
      socket.on('ticket:assigned', handleSocketTicketUpdated);
      socket.on('ticket:accepted', handleSocketTicketUpdated);
      socket.on('ticket:updated', handleSocketTicketUpdated);
      socket.on('ticket:resolved', handleSocketTicketUpdated);
      socket.on('ticket:denied', handleSocketTicketUpdated);
      socket.on('ticket:closed', handleSocketTicketUpdated);
      socket.on('ticket:status-changed', handleSocketTicketUpdated);
    }

    return () => {
      window.removeEventListener('ticket:assigned', handleTicketUpdated);
      window.removeEventListener('ticket:accepted', handleTicketUpdated);
      window.removeEventListener('ticket:updated', handleTicketUpdated);
      window.removeEventListener('ticket:resolved', handleTicketUpdated);
      window.removeEventListener('ticket:denied', handleTicketUpdated);
      window.removeEventListener('ticket:closed', handleTicketUpdated);
      
      if (socket) {
        socket.off('ticket:assigned', handleSocketTicketUpdated);
        socket.off('ticket:accepted', handleSocketTicketUpdated);
        socket.off('ticket:updated', handleSocketTicketUpdated);
        socket.off('ticket:resolved', handleSocketTicketUpdated);
        socket.off('ticket:denied', handleSocketTicketUpdated);
        socket.off('ticket:closed', handleSocketTicketUpdated);
        socket.off('ticket:status-changed', handleSocketTicketUpdated);
      }
    };
  }, [socket, status]);

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
      const assignRes = await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, { staffId, priority });
      
      // Check if response contains updated ticket
      let updatedTicket = assignRes?.data || assignRes;
      
      // If response doesn't contain full ticket, fetch it
      if (!updatedTicket || !updatedTicket.id || !updatedTicket.status) {
        try {
          const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketId}`);
          updatedTicket = ticketRes?.data || ticketRes;
        } catch (fetchErr) {
          console.error('Failed to fetch updated ticket:', fetchErr);
        }
      }
      
      // If ticket has assignee but status is still "open", update status to "assigned"
      if (updatedTicket && (updatedTicket.assigneeId || updatedTicket.assignee) && updatedTicket.status === "open") {
        try {
          // Update status to "assigned" via API
          await apiClient.patch(`/api/v1/tickets/${ticketId}`, {
            status: "assigned"
          });
          
          // Fetch lại ticket từ server để verify status đã được cập nhật
          try {
            const verifyRes = await apiClient.get(`/api/v1/tickets/${ticketId}`);
            const verifiedTicket = verifyRes?.data || verifyRes;
            
            // Chỉ sử dụng ticket từ server nếu status đã được cập nhật thành "assigned"
            if (verifiedTicket && verifiedTicket.status === "assigned") {
              updatedTicket = verifiedTicket;
            } else {
              // Nếu server chưa cập nhật, vẫn set local state nhưng log warning
              console.warn('Server status not updated yet, using local update');
              updatedTicket.status = "assigned";
            }
          } catch (verifyErr) {
            console.error('Failed to verify ticket status:', verifyErr);
            // Fallback: set local status
            updatedTicket.status = "assigned";
          }
        } catch (updateErr) {
          console.error('Failed to update ticket status:', updateErr);
          setNotification({ 
            type: "error", 
            message: "Ticket assigned but failed to update status. Please refresh the page." 
          });
          // Vẫn cập nhật local state để UI hiển thị đúng
          updatedTicket.status = "assigned";
        }
      }
      
      if (updatedTicket) {
        // Fetch room details if needed
        if (updatedTicket.roomId && (!updatedTicket.room?.code || !updatedTicket.room?.floor)) {
          try {
            const roomRes = await apiClient.get(`/api/v1/rooms/${updatedTicket.roomId}`);
            updatedTicket.room = roomRes.data || roomRes;
          } catch (err) {
            console.error(`Failed to fetch room ${updatedTicket.roomId}:`, err);
          }
        }
        
        // Update local state immediately
        setTickets((prevTickets) => {
          // Nếu ticket không còn phù hợp với status filter, xóa khỏi danh sách
          if (status && updatedTicket.status !== status) {
            return prevTickets.filter(t => t.id !== updatedTicket.id);
          }
          return prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
        });
        
        // Emit event for real-time update (socket và window event listeners sẽ xử lý)
        window.dispatchEvent(new CustomEvent('ticket:assigned', { 
          detail: updatedTicket 
        }));
      }
      
      setNotification({ type: "success", message: "Ticket assigned successfully!" });
      setAssignModal(null);
      // Không cần gọi loadTickets() vì đã cập nhật local state và có socket listeners
    } catch (err) {
      console.error("Failed to assign:", err);
      console.error("Error details:", err.response?.data);
      setNotification({ type: "error", message: err.response?.data?.message || "Failed to assign ticket" });
    }
  };

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
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
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

  // Filter tickets based on search term
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      ticket.title?.toLowerCase().includes(search) ||
      ticket.description?.toLowerCase().includes(search) ||
      ticket.creator?.username?.toLowerCase().includes(search) ||
      ticket.creator?.email?.toLowerCase().includes(search) ||
      ticket.assignee?.username?.toLowerCase().includes(search) ||
      ticket.assignee?.email?.toLowerCase().includes(search) ||
      ticket.room?.name?.toLowerCase().includes(search) ||
      ticket.department?.name?.toLowerCase().includes(search) ||
      ticket.status?.toLowerCase().includes(search) ||
      ticket.priority?.toLowerCase().includes(search) ||
      ticket.deniedReason?.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
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
                      {searchTerm ? `No ${status} tickets match your search` : `No ${status} tickets found`}
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
                      <div
                        style={{
                          color: "#111827",
                          fontWeight: 500,
                          marginBottom: "0.25rem",
                        }}
                      >
                        {ticket.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                        Created by: {ticket.creator?.username || ticket.creator?.email || "N/A"}
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
                          <div style={{ fontWeight: 500, color: "#111827" }}>
                            {ticket.room.name || "N/A"}
                          </div>
                          {(ticket.room.code || ticket.room.floor) && (
                            <div style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
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
                          <div style={{ fontWeight: 500, color: "#111827" }}>
                            {ticket.department.name || "N/A"}
                          </div>
                          {ticket.department.code && (
                            <div style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
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
                      {ticket.assignee?.username ||
                        ticket.assignee?.fullName ||
                        "N/A"}
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
                      style={{ padding: "1rem" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "center",
                          flexWrap: "nowrap",
                        }}
                      >
                        {ticket.status !== "in_progress" &&
                          ticket.status !== "closed" &&
                          ticket.status !== "escalated" && (
                            <ActionButton
                              variant="primary"
                              onClick={() => navigate(`/admin/tickets/edit/${ticket.id}`)}
                            >
                              Edit
                            </ActionButton>
                          )}
                        {(() => {
                          const canAssign = ticket.status === "open";
                          if (!canAssign) return null;
                          return (
                            <ActionButton
                              variant="success"
                              onClick={() => setAssignModal(ticket)}
                            >
                              Assign
                            </ActionButton>
                          );
                        })()}
                        <ActionButton
                          variant="danger"
                          onClick={() => handleDeleteClick(ticket.id)}
                        >
                          Delete
                        </ActionButton>
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
        <AlertModal
          isOpen={!!notification}
          message={notification.message}
          title={notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Notice'}
          type={notification.type || 'info'}
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

export default StatusTickets;
