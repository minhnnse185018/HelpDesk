import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import {
  formatDate,
  getStatusBadge,
  getPriorityBadge,
} from "../../utils/ticketHelpers.jsx";
import AssignTicketModal from "../../components/modals/AssignTicketModal";
import { AlertModal } from "../../components/templates";
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

// Helper function to enrich ticket with category data
const enrichTicketWithCategories = async (ticket) => {
  if (Array.isArray(ticket.ticketCategories) && ticket.ticketCategories.length > 0) {
    ticket.ticketCategories = await Promise.all(
      ticket.ticketCategories.map(async (tc) => {
        // Nếu đã có category object đầy đủ, không cần fetch lại
        if (tc.category && tc.category.name) {
          return tc;
        }
        
        // Nếu chỉ có categoryId, fetch category details
        if (tc.categoryId && !tc.category) {
          try {
            const catRes = await apiClient.get(`/api/v1/categories/${tc.categoryId}`);
            return { ...tc, category: catRes?.data || catRes };
          } catch (err) {
            console.error(`Failed to fetch category ${tc.categoryId}:`, err);
            return tc;
          }
        }
        
        return tc;
      })
    );
  }
  return ticket;
};

// Helper function to enrich sub-tickets with category, department, and assignee
const enrichSubTickets = async (subTickets) => {
  if (!Array.isArray(subTickets) || subTickets.length === 0) {
    return subTickets;
  }

  return await Promise.all(
    subTickets.map(async (subTicket) => {
      // Fetch category if missing
      if (subTicket.categoryId && !subTicket.category) {
        try {
          const catRes = await apiClient.get(`/api/v1/categories/${subTicket.categoryId}`);
          subTicket.category = catRes?.data || catRes;
          
          // Fetch department from category if missing
          if (subTicket.category?.departmentId && !subTicket.category?.department) {
            try {
              const deptRes = await apiClient.get(`/api/v1/departments/${subTicket.category.departmentId}`);
              subTicket.category.department = deptRes?.data || deptRes;
            } catch (err) {
              console.error(`Failed to fetch department for sub-ticket category:`, err);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch category for sub-ticket:`, err);
        }
      }
      
      // Fetch assignee if only assignedTo ID is provided
      if ((subTicket.assignedTo || subTicket.assigneeId) && !subTicket.assignee) {
        const assigneeId = subTicket.assignedTo || subTicket.assigneeId;
        try {
          const assigneeRes = await apiClient.get(`/api/v1/users/${assigneeId}`);
          subTicket.assignee = assigneeRes?.data || assigneeRes;
        } catch (err) {
          console.error(`Failed to fetch assignee for sub-ticket:`, err);
        }
      }
      
      return subTicket;
    })
  );
};

// Helper function to enrich ticket with data from sub-tickets if parent is missing info
const enrichTicketFromSubTickets = (ticket) => {
  if (!ticket.subTickets || !Array.isArray(ticket.subTickets) || ticket.subTickets.length === 0) {
    return ticket;
  }

  // Get categories from sub-tickets if parent doesn't have categories
  if (!ticket.ticketCategories || ticket.ticketCategories.length === 0) {
    const categoryMap = new Map();
    ticket.subTickets.forEach((subTicket) => {
      if (subTicket.category && !categoryMap.has(subTicket.category.id)) {
        categoryMap.set(subTicket.category.id, subTicket.category);
      }
    });
    
    if (categoryMap.size > 0) {
      ticket.ticketCategories = Array.from(categoryMap.values()).map(category => ({
        categoryId: category.id,
        category: category
      }));
    }
  }

  // Get department from sub-tickets if parent doesn't have department
  if (!ticket.department) {
    // Try to get department from first sub-ticket's category
    const firstSubTicket = ticket.subTickets[0];
    if (firstSubTicket?.category?.department) {
      ticket.department = firstSubTicket.category.department;
    } else if (firstSubTicket?.category?.departmentId) {
      // Department will be fetched in enrichSubTickets
      // For now, we'll fetch it here if needed
      // But ideally it should already be in category.department after enrichSubTickets
    }
  }

  // Get assignee from sub-tickets if parent doesn't have assignee
  // Check both assignee object and assignedTo/assigneeId
  const subTicketsWithAssignee = ticket.subTickets.filter(st => 
    st.assignee || st.assignedTo || st.assigneeId
  );
  
  if (!ticket.assignee && subTicketsWithAssignee.length > 0) {
    const assignees = subTicketsWithAssignee
      .map(st => {
        // If assignee object exists, use it
        if (st.assignee) {
          return st.assignee;
        }
        // Otherwise, return null (will be filtered out)
        return null;
      })
      .filter(Boolean);
    
    // If all sub-tickets have the same assignee, use that
    if (assignees.length > 0) {
      const uniqueAssignees = Array.from(new Map(assignees.map(a => [a.id || a.userId, a])).values());
      if (uniqueAssignees.length === 1) {
        ticket.assignee = uniqueAssignees[0];
      } else if (uniqueAssignees.length > 1) {
        // Multiple assignees - use the first one
        ticket.assignee = uniqueAssignees[0];
      }
    }
  }

  return ticket;
};

// Helper function to fully enrich ticket with all related data
const enrichTicket = async (ticket) => {
  await enrichTicketWithRoom(ticket);
  await enrichTicketWithCategories(ticket);
  
  // Enrich sub-tickets if they exist
  if (ticket.subTickets && Array.isArray(ticket.subTickets) && ticket.subTickets.length > 0) {
    ticket.subTickets = await enrichSubTickets(ticket.subTickets);
    // Enrich parent ticket with data from sub-tickets
    enrichTicketFromSubTickets(ticket);
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

      // Enrich tickets with room and category data
      ticketsArray = await Promise.all(
        ticketsArray.map(enrichTicket)
      );

      // Merge với local state để tránh mất data vừa được cập nhật
      // Đặc biệt quan trọng khi user back từ ticket detail sau khi assign
      setTickets((prevTickets) => {
        const prevTicketsMap = new Map(prevTickets.map(t => [t.id, t]));
        const mergedTickets = ticketsArray.map(serverTicket => {
          const localTicket = prevTicketsMap.get(serverTicket.id);
          
          // Nếu local ticket có status "assigned" và server trả về "open" nhưng có assignee
          // => server có thể chưa cập nhật kịp, giữ lại status "assigned" từ local
          if (localTicket && 
              localTicket.status === "assigned" && 
              serverTicket.status === "open" &&
              (serverTicket.assigneeId || serverTicket.assignee)) {
            return { ...serverTicket, status: "assigned" };
          }
          
          // Nếu local ticket có category data đầy đủ hơn server ticket, merge lại
          if (localTicket && 
              Array.isArray(localTicket.ticketCategories) && 
              localTicket.ticketCategories.length > 0 &&
              localTicket.ticketCategories.every(tc => tc.category && tc.category.name) &&
              (!Array.isArray(serverTicket.ticketCategories) || 
               serverTicket.ticketCategories.some(tc => !tc.category || !tc.category.name))) {
            return { ...serverTicket, ticketCategories: localTicket.ticketCategories };
          }
          
          return serverTicket;
        });
        
        // Thêm các ticket từ local state không có trong server response
        prevTickets.forEach(localTicket => {
          const existsInServer = mergedTickets.some(t => t.id === localTicket.id);
          if (!existsInServer) {
            mergedTickets.push(localTicket);
          }
        });
        
        return mergedTickets;
      });
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
      }
      
      // Enrich with room and category data (whether fetched or not)
      await enrichTicket(fullTicket);

      setTickets((prevTickets) => {
        const exists = prevTickets.some(t => t.id === fullTicket.id);
        if (exists) return prevTickets;
        return [fullTicket, ...prevTickets];
      });
    } catch (err) {
      console.error('Failed to add ticket to list:', err);
      // Fallback: enrich and add ticket as-is if fetch failed
      try {
        await enrichTicket(ticketData);
        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === ticketData.id);
          if (exists) return prevTickets;
          return [ticketData, ...prevTickets];
        });
      } catch (enrichErr) {
        console.error('Failed to enrich ticket:', enrichErr);
        // Last resort: add ticket as-is
        setTickets((prevTickets) => {
          const exists = prevTickets.some(t => t.id === ticketData.id);
          if (exists) return prevTickets;
          return [ticketData, ...prevTickets];
        });
      }
    }
  }, []);

  // Helper function to update ticket in list (handles all status changes)
  const updateTicketInList = useCallback(async (ticketData, fetchFullDetails = true) => {
    if (!ticketData || !ticketData.id) return;

    try {
      let updatedTicket = ticketData;
      
      if (fetchFullDetails) {
        try {
          const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketData.id}`);
          updatedTicket = ticketRes?.data || ticketRes;
        } catch (fetchErr) {
          console.error('Failed to fetch ticket details:', fetchErr);
          // Use ticketData as-is if fetch fails
          updatedTicket = ticketData;
        }
      }
      
      // Enrich with room and category data
      await enrichTicket(updatedTicket);
      
      setTickets((prevTickets) => {
        const existingTicket = prevTickets.find(t => t.id === updatedTicket.id);
        
        // Nếu ticket đã tồn tại, update nó với data mới nhất
        if (existingTicket) {
          // Chỉ preserve status "assigned" nếu local state có và server trả về "open" (server chưa cập nhật kịp)
          // Với các status khác, luôn trust server data
          if (existingTicket.status === "assigned" && 
              updatedTicket.status === "open" &&
              (updatedTicket.assigneeId || updatedTicket.assignee)) {
            return prevTickets.map(t => 
              t.id === updatedTicket.id 
                ? { ...updatedTicket, status: "assigned" }
                : t
            );
          }
          
          // Update với data mới nhất từ server
          return prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
        }
        
        // Nếu ticket chưa tồn tại, thêm vào danh sách
        return [updatedTicket, ...prevTickets];
      });
    } catch (err) {
      console.error('Failed to update ticket in list:', err);
    }
  }, []);

  // Listen for ticket events (real-time update)
  useEffect(() => {
    // Listen for custom window event (from CreateTicket)
    const handleTicketCreated = (event) => {
      addTicketToList(event.detail, true);
    };

    // Generic handler for all ticket updates (assigned, accepted, in_progress, resolved, etc.)
    const handleTicketUpdated = async (event) => {
      const updatedTicket = event.detail;
      if (!updatedTicket?.id) return;
      
      // Update ticket với data mới nhất
      await updateTicketInList(updatedTicket, true);
    };

    // Listen for socket event from server
    const handleSocketTicketCreated = (ticketData) => {
      addTicketToList(ticketData, true);
    };

    // Generic handler for all socket ticket updates
    const handleSocketTicketUpdated = async (ticketData) => {
      if (!ticketData?.id) return;
      await updateTicketInList(ticketData, true);
    };

    // Register event listeners for all ticket update events
    window.addEventListener('ticket:created', handleTicketCreated);
    window.addEventListener('ticket:assigned', handleTicketUpdated);
    window.addEventListener('ticket:accepted', handleTicketUpdated);
    window.addEventListener('ticket:updated', handleTicketUpdated);
    window.addEventListener('ticket:resolved', handleTicketUpdated);
    window.addEventListener('ticket:denied', handleTicketUpdated);
    window.addEventListener('ticket:closed', handleTicketUpdated);
    
    if (socket) {
      socket.on('ticket:created', handleSocketTicketCreated);
      socket.on('ticket:assigned', handleSocketTicketUpdated);
      socket.on('ticket:accepted', handleSocketTicketUpdated);
      socket.on('ticket:updated', handleSocketTicketUpdated);
      socket.on('ticket:resolved', handleSocketTicketUpdated);
      socket.on('ticket:denied', handleSocketTicketUpdated);
      socket.on('ticket:closed', handleSocketTicketUpdated);
      // Listen for generic ticket update event (nếu server emit)
      socket.on('ticket:status-changed', handleSocketTicketUpdated);
    }

    return () => {
      window.removeEventListener('ticket:created', handleTicketCreated);
      window.removeEventListener('ticket:assigned', handleTicketUpdated);
      window.removeEventListener('ticket:accepted', handleTicketUpdated);
      window.removeEventListener('ticket:updated', handleTicketUpdated);
      window.removeEventListener('ticket:resolved', handleTicketUpdated);
      window.removeEventListener('ticket:denied', handleTicketUpdated);
      window.removeEventListener('ticket:closed', handleTicketUpdated);
      
      if (socket) {
        socket.off('ticket:created', handleSocketTicketCreated);
        socket.off('ticket:assigned', handleSocketTicketUpdated);
        socket.off('ticket:accepted', handleSocketTicketUpdated);
        socket.off('ticket:updated', handleSocketTicketUpdated);
        socket.off('ticket:resolved', handleSocketTicketUpdated);
        socket.off('ticket:denied', handleSocketTicketUpdated);
        socket.off('ticket:closed', handleSocketTicketUpdated);
        socket.off('ticket:status-changed', handleSocketTicketUpdated);
      }
    };
  }, [socket, addTicketToList, updateTicketInList]);

  const handleDeleteClick = useCallback((ticketId) => {
    setDeleteConfirmModal(ticketId);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const ticketId = deleteConfirmModal;
    if (!ticketId) return;
    
    setDeleteConfirmModal(null);

    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`);
      
      // Remove ticket from state immediately for instant UI update
      setTickets((prevTickets) => prevTickets.filter(t => t.id !== ticketId));
      
      setNotification({ type: "success", message: "Ticket deleted successfully!" });
      
      // Optionally reload to sync with server (but UI already updated)
      // loadTickets();
    } catch (err) {
      console.error("Failed to delete:", err);
      setNotification({ type: "error", message: "Failed to delete ticket" });
      // If delete failed, reload to get correct state
      loadTickets();
    }
  }, [deleteConfirmModal, loadTickets]);

  const handleAssign = useCallback(async (ticketId, staffId, priority) => {
    try {
      // Step 1: Assign ticket
      await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, {
        staffId,
        priority,
      });
      
      // Step 2: Update status to "assigned" if needed
      try {
        await apiClient.patch(`/api/v1/tickets/${ticketId}`, {
          status: "assigned"
        });
      } catch (updateErr) {
        console.error('Failed to update ticket status:', updateErr);
        // Continue anyway, status might be updated by backend
      }
      
      // Step 3: Đợi một chút để server cập nhật xong (tránh race condition)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 4: Fetch lại ticket đầy đủ từ server để đảm bảo có tất cả data mới nhất
      let updatedTicket;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketId}`);
          updatedTicket = ticketRes?.data || ticketRes;
          
          // Verify ticket đã được assign và status đã được cập nhật
          if (updatedTicket && 
              (updatedTicket.assigneeId || updatedTicket.assignee) && 
              (updatedTicket.status === "assigned" || updatedTicket.status === "open")) {
            // Nếu status vẫn là "open" nhưng đã có assignee, set thành "assigned"
            if (updatedTicket.status === "open") {
              updatedTicket.status = "assigned";
            }
            break; // Đã có data đầy đủ, thoát khỏi retry loop
          }
          
          // Nếu chưa có assignee, đợi thêm và retry
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          retryCount++;
        } catch (fetchErr) {
          console.error(`Failed to fetch updated ticket (attempt ${retryCount + 1}):`, fetchErr);
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          retryCount++;
        }
      }
      
      // Nếu vẫn không fetch được, thử lần cuối với data từ assign response
      if (!updatedTicket || !updatedTicket.id) {
        console.warn('Could not fetch updated ticket, using fallback');
        try {
          const ticketRes = await apiClient.get(`/api/v1/tickets/${ticketId}`);
          updatedTicket = ticketRes?.data || ticketRes;
        } catch (err) {
          console.error('Final fetch attempt failed:', err);
          setNotification({
            type: "error",
            message: "Ticket assigned but failed to refresh data. Please refresh the page.",
          });
          setAssignModal(null);
          return;
        }
      }
      
      // Step 5: Enrich ticket với tất cả related data (room, category, etc.)
      await enrichTicket(updatedTicket);
      
      // Step 6: Update local state với data đầy đủ
      setTickets((prevTickets) => 
        prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t)
      );
      
      // Step 7: Emit event for real-time update
      window.dispatchEvent(new CustomEvent('ticket:assigned', { 
        detail: updatedTicket 
      }));
      
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
  }, []);

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
                      {(() => {
                        // Get department from parent or sub-tickets
                        let department = ticket.department;
                        if (!department && ticket.subTickets && Array.isArray(ticket.subTickets) && ticket.subTickets.length > 0) {
                          const firstSubTicket = ticket.subTickets.find(st => st.category?.department);
                          if (firstSubTicket?.category?.department) {
                            department = firstSubTicket.category.department;
                          }
                        }
                        
                        return department ? (
                          <div>
                            <div style={{ fontWeight: 500, color: "#6b7280" }}>
                              {department.name || "N/A"}
                            </div>
                            {department.code && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  marginTop: "0.125rem",
                                }}
                              >
                                ({department.code})
                              </div>
                            )}
                          </div>
                        ) : (
                          "N/A"
                        );
                      })()}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#6b7280",
                        fontSize: "0.8rem",
                      }}
                    >
                      {(() => {
                        // Get categories from parent or sub-tickets
                        let categories = [];
                        if (Array.isArray(ticket.ticketCategories) && ticket.ticketCategories.length > 0) {
                          categories = ticket.ticketCategories.map((tc) => tc.category?.name).filter(Boolean);
                        } else if (ticket.subTickets && Array.isArray(ticket.subTickets) && ticket.subTickets.length > 0) {
                          // Get unique categories from sub-tickets
                          const categoryMap = new Map();
                          ticket.subTickets.forEach((st) => {
                            if (st.category?.name && !categoryMap.has(st.category.id)) {
                              categoryMap.set(st.category.id, st.category.name);
                            }
                          });
                          categories = Array.from(categoryMap.values());
                        }
                        
                        return categories.length > 0 ? categories.join(", ") : "N/A";
                      })()}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {(() => {
                        // Get assignee from parent or sub-tickets
                        let assignee = ticket.assignee;
                        if (!assignee && ticket.subTickets && Array.isArray(ticket.subTickets) && ticket.subTickets.length > 0) {
                          // Check both assignee object and assignedTo/assigneeId
                          const assignees = ticket.subTickets
                            .filter(st => st.assignee || st.assignedTo || st.assigneeId)
                            .map(st => st.assignee)
                            .filter(Boolean);
                          
                          if (assignees.length > 0) {
                            // If all sub-tickets have the same assignee, use that
                            const uniqueAssignees = Array.from(new Map(assignees.map(a => [a.id || a.userId, a])).values());
                            if (uniqueAssignees.length === 1) {
                              assignee = uniqueAssignees[0];
                            } else if (uniqueAssignees.length > 1) {
                              // Multiple assignees - show first one with indicator
                              assignee = uniqueAssignees[0];
                            }
                          }
                        }
                        
                        return assignee ? (
                          <>
                            <div style={{ fontWeight: 500, color: "#6b7280" }}>
                              {assignee.username || assignee.email || "N/A"}
                            </div>
                            {assignee.fullName && (
                              <div style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
                                {assignee.fullName}
                              </div>
                            )}
                            {ticket.subTickets && 
                             Array.isArray(ticket.subTickets) && 
                             ticket.subTickets.length > 0 &&
                             ticket.subTickets.filter(st => st.assignee).length > 1 && (
                              <div style={{ fontSize: "0.7rem", marginTop: "0.125rem", color: "#9ca3af", fontStyle: "italic" }}>
                                +{ticket.subTickets.filter(st => st.assignee).length - 1} more
                              </div>
                            )}
                          </>
                        ) : (
                          "N/A"
                        );
                      })()}
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

export default AllTickets;
