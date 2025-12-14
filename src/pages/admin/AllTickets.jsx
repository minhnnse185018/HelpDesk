import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import {
  formatDate,
} from "../../utils/ticketHelpers.jsx";
import AssignTicketModal from "../../components/modals/AssignTicketModal";
import NotificationModal from "../../components/modals/NotificationModal";

const getStatusColor = (status) => {
  const colors = {
    open: { bg: "#e0e7ff", text: "#3730a3" },
    assigned: { bg: "#dbeafe", text: "#1e40af" },
    in_progress: { bg: "#fef3c7", text: "#92400e" },
    resolved: { bg: "#d1fae5", text: "#065f46" },
    denied: { bg: "#fee2e2", text: "#991b1b" },
    closed: { bg: "#f3f4f6", text: "#374151" },
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadTickets();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDeleteClick = (ticketId) => {
    setDeleteConfirmModal(ticketId);
  };

  const handleDeleteConfirm = async () => {
    const ticketId = deleteConfirmModal;
    setDeleteConfirmModal(null);

    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`);
      setNotification({ type: "success", message: "Xóa ticket thành công!" });
      loadTickets();
    } catch (err) {
      console.error("Failed to delete:", err);
      setNotification({ type: "error", message: "Xóa ticket thất bại" });
    }
  };

  const handleAssign = async (ticketId, staffId, priority) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, {
        staffId,
        priority,
      });
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
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
          width:"100%"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
              minWidth: "500px",
              
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
                      <div
                        style={{
                          color: "#111827",
                          fontWeight: 500,
                          marginBottom: "0.25rem",
                        }}
                      >
                        {ticket.title}
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
                        {ticket.status !== "in_progress" && (
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
                          if (!canAssign) return null;
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
              Xác nhận xóa
            </h3>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "1.5rem",
                lineHeight: "1.5",
              }}
            >
              Bạn có chắc chắn muốn xóa ticket này không? Hành động này không
              thể hoàn tác.
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
                Hủy
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
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AllTickets;
