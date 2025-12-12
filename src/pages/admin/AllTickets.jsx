import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { formatDate, getPriorityBadge, getStatusBadge } from "../../utils/ticketHelpers.jsx";
import AssignTicketModal from "../../components/modals/AssignTicketModal";
import NotificationModal from "../../components/modals/NotificationModal";

function AllTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

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

      const ticketsArray = Array.isArray(data) ? data : [];
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
  }, []);

  const handleDelete = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?"))
      return;
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
      await apiClient.put(`/api/v1/tickets/${ticketId}/assign`, { staffId, priority });
      setNotification({ type: "success", message: "Ticket assigned successfully!" });
      setAssignModal(null);
      loadTickets();
    } catch (err) {
      console.error("Failed to assign:", err);
      setNotification({ type: "error", message: "Failed to assign ticket" });
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
              {tickets.length === 0 ? (
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
                      No tickets found
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
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
                      {ticket.room?.name || "N/A"}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {ticket.department?.name || "N/A"}
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
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
                        {(() => {
                          const canAssign =
                            ticket.status === "open" ||
                            ticket.status === "assigned";
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
                          onClick={() => handleDelete(ticket.id)}
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
    </>
  );
}

export default AllTickets;
