import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import AssignTicketModal from "../../components/modals/AssignTicketModal";
import NotificationModal from "../../components/modals/NotificationModal";

function SubTickets({ searchTerm = "" }) {
  const navigate = useNavigate();
  const [subTickets, setSubTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);

  useEffect(() => {
    fetchSubTickets();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSubTickets();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSubTickets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/v1/tickets/with-subtickets");

      // Extract all sub-tickets from all tickets
      const allSubTickets = [];

      // Data is directly in response.data, not response.data.data
      const ticketsData = response?.data;

      if (ticketsData && typeof ticketsData === "object") {
        const tickets = Array.isArray(ticketsData)
          ? ticketsData
          : Object.values(ticketsData);

        tickets.forEach((ticket) => {
          if (ticket && ticket.subTickets && ticket.subTickets.length > 0) {
            ticket.subTickets.forEach((subTicket) => {
              allSubTickets.push({
                ...subTicket,
                parentTicket: {
                  id: ticket.id,
                  title: ticket.title,
                  description: ticket.description,
                  room: ticket.room,
                  creator: ticket.creator,
                  attachments: ticket.attachments || [],
                },
              });
            });
          }
        });
      }

      // Fetch additional details for each sub-ticket (category and department)
      const enrichedSubTickets = await Promise.all(
        allSubTickets.map(async (subTicket) => {
          const enriched = { ...subTicket };

          // Fetch category details
          if (subTicket.categoryId) {
            try {
              const categoryResponse = await apiClient.get(
                `/api/v1/categories/${subTicket.categoryId}`
              );
              enriched.category = categoryResponse.data;
            } catch (error) {
              console.error("Error fetching category:", error);
              enriched.category = null;
            }
          }

          // Fetch department details from assignee's departmentId
          if (subTicket.assignee?.departmentId) {
            try {
              const deptResponse = await apiClient.get(
                `/api/v1/departments/${subTicket.assignee.departmentId}`
              );
              enriched.department = deptResponse.data;
            } catch (error) {
              console.error("Error fetching department:", error);
              enriched.department = null;
            }
          }

          return enriched;
        })
      );

      setSubTickets(enrichedSubTickets);
    } catch (err) {
      setError(err.message || "Failed to fetch sub-tickets");
      console.error("Error fetching sub-tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: { bg: "#dbeafe", text: "#1e40af" },
      in_progress: { bg: "#fef3c7", text: "#92400e" },
      resolved: { bg: "#d1fae5", text: "#065f46" },
      denied: { bg: "#fee2e2", text: "#991b1b" },
    };
    return colors[status] || { bg: "#f3f4f6", text: "#374151" };
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: { bg: "#dbeafe", text: "#1e40af" },
      medium: { bg: "#fef3c7", text: "#92400e" },
      high: { bg: "#fed7aa", text: "#9a3412" },
      urgent: { bg: "#fecaca", text: "#991b1b" },
    };
    return colors[priority] || { bg: "#f3f4f6", text: "#374151" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const handleAssign = async (subTicketId, staffId, priority) => {
    try {
      await apiClient.post(
        `/api/v1/sub-tickets/${subTicketId}/assign-category`,
        {
          staffId,
          priority,
        }
      );
      setNotification({
        type: "success",
        message: "Sub-ticket assigned successfully!",
      });
      setAssignModal(null);
      fetchSubTickets();
    } catch (err) {
      console.error("Failed to assign sub-ticket:", err);
      console.error("Error details:", err.response?.data);
      setNotification({
        type: "error",
        message: err?.response?.data?.message || "Failed to assign sub-ticket",
      });
    }
  };

  const handleView = (subTicketId) => {
    navigate(`/admin/sub-tickets/${subTicketId}`);
  };

  const handleDeleteClick = (subTicketId) => {
    setDeleteConfirmModal(subTicketId);
  };

  const handleDeleteConfirm = async () => {
    const subTicketId = deleteConfirmModal;
    setDeleteConfirmModal(null);

    try {
      await apiClient.delete(`/api/v1/sub-tickets/${subTicketId}`);
      setNotification({
        type: "success",
        message: "Xóa sub-ticket thành công!",
      });
      fetchSubTickets();
    } catch (err) {
      console.error("Failed to delete sub-ticket:", err);
      setNotification({
        type: "error",
        message: err?.response?.data?.message || "Xóa sub-ticket thất bại",
      });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
        Loading sub-tickets...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderRadius: "0.5rem",
        }}
      >
        {error}
      </div>
    );
  }

  // Filter subTickets based on searchTerm
  const filteredSubTickets = subTickets.filter((subTicket) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      subTicket.parentTicket?.title?.toLowerCase().includes(search) ||
      subTicket.parentTicket?.description?.toLowerCase().includes(search) ||
      subTicket.category?.name?.toLowerCase().includes(search) ||
      subTicket.assignee?.username?.toLowerCase().includes(search) ||
      subTicket.assignee?.fullName?.toLowerCase().includes(search) ||
      subTicket.assignee?.email?.toLowerCase().includes(search) ||
      subTicket.department?.name?.toLowerCase().includes(search) ||
      subTicket.status?.toLowerCase().includes(search) ||
      subTicket.priority?.toLowerCase().includes(search) ||
      subTicket.parentTicket?.room?.name?.toLowerCase().includes(search) ||
      subTicket.resolutionNote?.toLowerCase().includes(search) ||
      subTicket.deniedReason?.toLowerCase().includes(search)
    );
  });

  return (
    <div>
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
                  Priority
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
              {filteredSubTickets.length === 0 ? (
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
                      {searchTerm ? "No sub-tickets match your search" : "No sub-tickets found"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubTickets.map((subTicket) => {
                  const statusColor = getStatusColor(subTicket.status);
                  const priorityColor = getPriorityColor(subTicket.priority);

                  return (
                    <tr
                      key={subTicket.id}
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
                          {subTicket.parentTicket.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                          Created by: {subTicket.parentTicket.creator?.username || subTicket.parentTicket.creator?.email || "N/A"}
                        </div>
                        {subTicket.resolutionNote && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#166534",
                              backgroundColor: "#dcfce7",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              marginTop: "0.25rem",
                            }}
                          >
                            <strong>Resolution:</strong>{" "}
                            {subTicket.resolutionNote}
                          </div>
                        )}
                        {subTicket.deniedReason && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#dc2626",
                              backgroundColor: "#fee2e2",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              marginTop: "0.25rem",
                            }}
                          >
                            <strong>Denied:</strong> {subTicket.deniedReason}
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
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                          }}
                        >
                          {subTicket.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            backgroundColor: priorityColor.bg,
                            color: priorityColor.text,
                          }}
                        >
                          {subTicket.priority?.toUpperCase() || "N/A"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", color: "#6b7280" }}>
                        {subTicket.parentTicket.room ? (
                          <div>
                            <div style={{ fontWeight: 500, color: "#111827" }}>
                              {subTicket.parentTicket.room.name || "N/A"}
                            </div>
                            {(subTicket.parentTicket.room.code || subTicket.parentTicket.room.floor) && (
                              <div style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
                                {subTicket.parentTicket.room.code && `(${subTicket.parentTicket.room.code})`}
                                {subTicket.parentTicket.room.code && subTicket.parentTicket.room.floor && " - "}
                                {subTicket.parentTicket.room.floor && `Floor ${subTicket.parentTicket.room.floor}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td style={{ padding: "1rem", color: "#6b7280" }}>
                        {subTicket.department ? (
                          <div>
                            <div style={{ fontWeight: 500, color: "#111827" }}>
                              {subTicket.department.name || "N/A"}
                            </div>
                            {subTicket.department.code && (
                              <div style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
                                ({subTicket.department.code})
                              </div>
                            )}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td style={{ padding: "1rem", color: "#6b7280" }}>
                        {subTicket.category?.name || "N/A"}
                      </td>
                      <td style={{ padding: "1rem", color: "#6b7280" }}>
                        <div style={{ fontWeight: 500, color: "#111827" }}>
                          {subTicket.assignee?.username || "N/A"}
                        </div>
                        {subTicket.assignee?.fullName && (
                          <div style={{ fontSize: "0.75rem", marginTop: "0.125rem" }}>
                            {subTicket.assignee.fullName}
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
                        {formatDate(subTicket.createdAt)}
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
                            onClick={() => handleView(subTicket.id)}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              backgroundColor: "rgba(59, 130, 246, 0.08)",
                              color: "#3b82f6",
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
                              e.currentTarget.style.transform =
                                "translateY(0)";
                            }}
                          >
                            View
                          </button>
                          {subTicket.status === "open" && (
                            <button
                              type="button"
                              onClick={() => setAssignModal(subTicket)}
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
                                  "0 8px 32px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)",
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
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(subTicket.id)}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              borderRadius: "14px",
                              cursor: "pointer",
                              transition:
                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              backdropFilter: "blur(40px) saturate(200%)",
                              boxShadow:
                                "0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)",
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
                              e.currentTarget.style.transform =
                                "translateY(0)";
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <AssignTicketModal
          ticket={assignModal}
          onClose={() => setAssignModal(null)}
          onSubmit={handleAssign}
        />
      )}

      {/* Notification Modal */}
      {notification && (
        <NotificationModal
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
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
              Bạn có chắc chắn muốn xóa sub-ticket này không? Hành động này không thể hoàn tác.
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
    </div>
  );
}

export default SubTickets;
