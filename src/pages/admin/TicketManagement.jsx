import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPriorityBadge(priority) {
  if (!priority) return "-";
  const configs = {
    low: { text: "#065f46", label: "Low" },
    medium: { text: "#92400e", label: "Medium" },
    high: { text: "#b91c1c", label: "High" },
    critical: { text: "#7f1d1d", label: "Critical" },
  };
  const config = configs[priority] || { text: "#4b5563", label: priority };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}

function getStatusBadge(status) {
  const configs = {
    open: { text: "#1e40af", label: "Open" },
    assigned: { text: "#92400e", label: "Assigned" },
    in_progress: { text: "#075985", label: "In Progress" },
    resolved: { text: "#166534", label: "Resolved" },
    closed: { text: "#374151", label: "Closed" },
    overdue: { text: "#991b1b", label: "Overdue" },
  };
  const config = configs[status] || { text: "#374151", label: status };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}

function TicketManagement() {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { key: "all", label: "All Tickets" },
    { key: "open", label: "Open" },
    { key: "assigned", label: "Assigned" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
    { key: "closed", label: "Closed" },
    { key: "pending-split", label: "Pending Split" },
    { key: "waiting-acceptance", label: "Waiting Acceptance" },
    { key: "overdue", label: "Overdue" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "0.5rem",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Ticket Management
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "0.875rem",
              margin: "0.5rem 0 0 0",
            }}
          >
            Manage and assign tickets across all departments
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            borderBottom: "2px solid #e5e7eb",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "0.875rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid #000000"
                    : "2px solid transparent",
                color: activeTab === tab.key ? "#000000" : "#6b7280",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "all" && <AllTicketsTab />}
        {activeTab === "open" && <StatusTicketsTab status="open" />}
        {activeTab === "assigned" && <StatusTicketsTab status="assigned" />}
        {activeTab === "in_progress" && (
          <StatusTicketsTab status="in_progress" />
        )}
        {activeTab === "resolved" && <StatusTicketsTab status="resolved" />}
        {activeTab === "closed" && <StatusTicketsTab status="closed" />}
        {activeTab === "pending-split" && <PendingSplitTab />}
        {activeTab === "waiting-acceptance" && <WaitingAcceptanceTab />}
        {activeTab === "overdue" && <OverdueTicketsTab />}
      </div>
    </div>
  );
}

// All Tickets Tab
function AllTicketsTab() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSortByPriority = () => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const sorted = [...tickets].sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      return sortOrder === "asc"
        ? priorityA - priorityB
        : priorityB - priorityA;
    });
    setTickets(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/v1/tickets");

      let data = response?.data?.data || response?.data || response;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        const keys = Object.keys(data);
        if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
          data = Object.values(data);
        } else {
          data = data.tickets || data.items || [];
        }
      }

      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleDelete = async (ticketId) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setNotification({
        type: "success",
        message: "Ticket deleted successfully!",
      });
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Unknown error";
      setNotification({ type: "error", message: errorMessage });
    }
  };

  const handleAssign = async (ticketId, staffId, priority) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, {
        staffId,
        priority,
      });
      setAssignModal(null);
      setNotification({
        type: "success",
        message: "Ticket assigned to staff successfully!",
      });
      await loadTickets();
    } catch (err) {
      console.error("Failed to assign ticket:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Unknown error";
      setNotification({ type: "error", message: errorMessage });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Loading
        </div>
        <div style={{ color: "#6b7280" }}>Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fee2e2",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ color: "#991b1b", fontWeight: 600 }}>❌ Error</div>
        <div style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</div>
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
                            e.target.style.backgroundColor =
                              "rgba(59, 130, 246, 0.15)";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              "0 12px 40px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor =
                              "rgba(59, 130, 246, 0.08)";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                              "0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)";
                          }}
                        >
                          Edit
                        </button>
                        {(() => {
                          const hasNoAssignee =
                            !ticket.assignee && !ticket.assignedTo;
                          const hasOneCategory =
                            ticket.ticketCategories?.length === 1;
                          const hasDeniedReason = ticket.deniedReason;
                          const canAssign =
                            (hasNoAssignee || hasDeniedReason) &&
                            hasOneCategory;

                          return canAssign ? (
                            <button
                              type="button"
                              onClick={() => setAssignModal(ticket)}
                              style={{
                                padding: "0.5rem 1rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                                color: "#1d1d1f",
                                border: "1px solid rgba(255, 255, 255, 0.18)",
                                borderRadius: "14px",
                                cursor: "pointer",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                backdropFilter: "blur(40px) saturate(200%)",
                                boxShadow:
                                  "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                              }}
                              onMouseOver={(e) => {
                                e.target.style.backgroundColor =
                                  "rgba(255, 255, 255, 0.15)";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                  "0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.7)";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.backgroundColor =
                                  "rgba(255, 255, 255, 0.08)";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                  "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)";
                              }}
                            >
                              {hasDeniedReason ? "Reassign" : "Assign"}
                            </button>
                          ) : null;
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
                            e.target.style.backgroundColor =
                              "rgba(239, 68, 68, 0.15)";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              "0 12px 40px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor =
                              "rgba(239, 68, 68, 0.08)";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                              "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)";
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

// Pending Split Tab
function PendingSplitTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [splitModal, setSplitModal] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/v1/tickets");

      let data = response?.data?.data || response?.data || response;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        const keys = Object.keys(data);
        if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
          data = Object.values(data);
        } else {
          data = data.tickets || data.items || [];
        }
      }

      const allTickets = Array.isArray(data) ? data : [];
      // Filter tickets with 2 or more categories
      const pendingSplit = allTickets.filter(
        (ticket) =>
          Array.isArray(ticket.ticketCategories) &&
          ticket.ticketCategories.length >= 2
      );
      setTickets(pendingSplit);
    } catch (err) {
      console.error("Failed to load pending split tickets:", err);
      setError(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSplit = async (ticketId, splits) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/split-categories`, {
        splits,
      });
      setSplitModal(null);
      setNotification({
        type: "success",
        message: "Ticket split successfully! Sub-tickets have been created.",
      });
      await loadTickets();
    } catch (err) {
      console.error("Failed to split ticket:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Unknown error";
      setNotification({ type: "error", message: errorMessage });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Loading
        </div>
        <div style={{ color: "#6b7280" }}>Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fee2e2",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ color: "#991b1b", fontWeight: 600 }}>❌ Error</div>
        <div style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</div>
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
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid rgba(243,244,246,0.6)",
          }}
        >
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
            Tickets with multiple categories that need to be split into
            sub-tickets
          </p>
        </div>

        {tickets.length === 0 ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}
          >
            <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              No tickets pending split
            </div>
          </div>
        ) : (
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
                    backgroundColor: "#f9fafb",
                    borderBottom: "2px solid #e5e7eb",
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
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        color: "#111827",
                        fontWeight: 500,
                      }}
                    >
                      {ticket.title}
                    </td>
                    <td style={{ padding: "1rem", color: "#6b7280" }}>
                      {ticket.room?.name || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#6b7280",
                        fontSize: "0.8rem",
                      }}
                    >
                      {Array.isArray(ticket.ticketCategories)
                        ? ticket.ticketCategories.map((tc) => tc.category?.name).join(", ")
                        : "N/A"}
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
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => setSplitModal(ticket)}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          color: "#1d1d1f",
                          border: "1px solid rgba(255, 255, 255, 0.18)",
                          borderRadius: "14px",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          backdropFilter: "blur(40px) saturate(200%)",
                          boxShadow:
                            "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor =
                            "rgba(255, 255, 255, 0.15)";
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.7)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor =
                            "rgba(255, 255, 255, 0.08)";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)";
                        }}
                      >
                        Split Categories
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {splitModal && (
        <SplitCategoriesModal
          ticket={splitModal}
          onClose={() => setSplitModal(null)}
          onSubmit={handleSplit}
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

// Split Categories Modal
function SplitCategoriesModal({ ticket, onClose, onSubmit }) {
  const [submitting, setSubmitting] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [groupAssignments, setGroupAssignments] = useState({});
  const [groupPriorities, setGroupPriorities] = useState({});

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await apiClient.get("/api/v1/users");
        let data = response?.data || response;
        
        // Convert to array if needed
        if (data && !Array.isArray(data)) {
          data = Object.values(data).filter(Boolean);
        }
        
        // Filter only staff role users
        const filteredStaff = (
          Array.isArray(data) ? data : []
        ).filter((user) => String(user.role || "").toLowerCase() === "staff");
        
        setStaffList(filteredStaff);

        const initialAssignments = {};
        const initialPriorities = {};
        ticket.ticketCategories?.forEach((tc) => {
          const categoryId = tc.category?.id;
          if (categoryId) {
            initialAssignments[categoryId] = "";
            initialPriorities[categoryId] = "medium";
          }
        });
        setGroupAssignments(initialAssignments);
        setGroupPriorities(initialPriorities);
      } catch (err) {
        console.error("Failed to load staff:", err);
      }
    };
    loadStaff();
  }, [ticket]);

  const handleAssignmentChange = (categoryId, staffId) => {
    setGroupAssignments((prev) => ({
      ...prev,
      [categoryId]: staffId,
    }));
  };

  const handlePriorityChange = (categoryId, priority) => {
    setGroupPriorities((prev) => ({
      ...prev,
      [categoryId]: priority,
    }));
  };

  const handleSubmit = async () => {
    const splits =
      ticket.ticketCategories
        ?.map((tc) => {
          const categoryId = tc.category?.id;
          if (!categoryId) return null;
          return {
            categoryIds: [categoryId],
            priority: groupPriorities[categoryId] || "medium",
            ...(groupAssignments[categoryId] && { staffId: groupAssignments[categoryId] }),
          };
        })
        .filter(Boolean) || [];

    setSubmitting(true);
    await onSubmit(ticket.id, splits);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "100%",
          maxWidth: "650px",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Split Categories & Assign Staff
          </h3>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "0.9rem",
                color: "#6b7280",
              }}
            >
              <strong style={{ color: "#374151" }}>Ticket:</strong>{" "}
              {ticket.title}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              This will create a separate sub-ticket for each category
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            {ticket.ticketCategories?.map((tc, index) => {
              const cat = tc.category;
              if (!cat) return null;
              return (
              <div
                key={cat.id}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#111827",
                    }}
                  >
                    Sub-ticket {index + 1}: {cat.name}
                  </span>
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label
                    htmlFor={`priority-${cat.id}`}
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#6b7280",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    id={`priority-${cat.id}`}
                    value={groupPriorities[cat.id] || "medium"}
                    onChange={(e) =>
                      handlePriorityChange(cat.id, e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      color: "#374151",
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`staff-${cat.id}`}
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#6b7280",
                    }}
                  >
                    Assign to Staff (Optional)
                  </label>
                  <select
                    id={`staff-${cat.id}`}
                    value={groupAssignments[cat.id] || ""}
                    onChange={(e) =>
                      handleAssignmentChange(cat.id, e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.9rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      color: "#374151",
                    }}
                  >
                    <option value="">-- No Assignment (Assign Later) --</option>
                    {staffList
                      .filter((staff) => {
                        // Filter staff by category's department
                        const categoryDeptId = cat.department?.id;
                        const staffDeptId = staff.department?.id;
                        // If category has no department or staff has no department, show all
                        if (!categoryDeptId) return true;
                        return staffDeptId === categoryDeptId;
                      })
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.fullName || staff.username}
                          {staff.department?.name && ` (${staff.department.name})`}
                        </option>
                      ))}
                  </select>
                  {cat.department && (
                    <p style={{ 
                      margin: "0.5rem 0 0 0", 
                      fontSize: "0.75rem", 
                      color: "#9ca3af" 
                    }}>
                      Showing staff from: {cat.department.name}
                    </p>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>

        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "0.625rem 1.25rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              backgroundColor: "rgba(0, 0, 0, 0.03)",
              color: "#6b7280",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "14px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
              backdropFilter: "blur(30px)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "0.625rem 1.25rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              color: "#1d1d1f",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "14px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
              backdropFilter: "blur(40px) saturate(200%)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {submitting ? "Splitting..." : "Split Tickets"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Assign Ticket Modal
// Assign Ticket Modal
function AssignTicketModal({ ticket, onClose, onSubmit }) {
  const [staffId, setStaffId] = useState("");
  const [priority, setPriority] = useState(ticket.priority || "medium");
  const [staffList, setStaffList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const staffRes = await apiClient.get("/api/v1/users");

        let staffData = staffRes?.data || staffRes;

        // Convert to array if needed
        if (staffData && !Array.isArray(staffData)) {
          staffData = Object.values(staffData).filter(Boolean);
        }

        // Filter only staff role users
        const filteredStaff = (
          Array.isArray(staffData) ? staffData : []
        ).filter((user) => String(user.role || "").toLowerCase() === "staff");

        setStaffList(filteredStaff);
      } catch (err) {
        console.error("Failed to load staff:", err);
      }
    };

    loadData();
  }, [ticket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staffId) {
      return;
    }
    if (!priority) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(ticket.id, staffId, priority);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          width: "100%",
          maxWidth: "600px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Assign Ticket to Staff
          </h3>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.85rem",
              color: "#6b7280",
            }}
          >
            Ticket: <strong>{ticket.title}</strong>
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Ticket info */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Room:{" "}
                </span>
                <span style={{ color: "#6b7280" }}>
                  {ticket.room?.name || "N/A"}
                </span>
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Current Priority:{" "}
                </span>
                <span style={{ color: "#6b7280", marginLeft: "0.25rem" }}>
                  {ticket.priority ? ticket.priority.toUpperCase() : "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: "#374151" }}>
                  Categories:{" "}
                </span>
                <span style={{ color: "#6b7280" }}>
                  {Array.isArray(ticket.ticketCategories) &&
                  ticket.ticketCategories.length > 0
                    ? ticket.ticketCategories
                        .map((tc) => tc.category?.name)
                        .filter(Boolean)
                        .join(", ")
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Staff select */}
            <div>
              <label
                htmlFor="staff"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Assign to Staff
                {staffList.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      fontWeight: 400,
                    }}
                  >
                    ({staffList.length} available)
                  </span>
                )}
              </label>
              <select
                id="staff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  fontSize: "0.9rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  color: "#374151",
                }}
              >
                <option value="">-- Select staff --</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName || staff.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority select */}
            <div>
              <label
                htmlFor="priority"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  fontSize: "0.9rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  color: "#374151",
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div
            style={{
              padding: "1.5rem",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "0.625rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                backgroundColor: "rgba(0, 0, 0, 0.03)",
                color: "#6b7280",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "14px",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
                backdropFilter: "blur(30px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.625rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#1d1d1f",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "14px",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.5 : 1,
                backdropFilter: "blur(40px) saturate(200%)",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {submitting ? "Assigning..." : "Assign Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Waiting Acceptance Tab
function WaitingAcceptanceTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/v1/tickets");
      let data = response?.data || response;
      
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const isNumericKeys = Object.keys(data).every((key) => !isNaN(key));
        if (isNumericKeys) {
          data = Object.values(data);
        } else {
          data = data.tickets || data.data || data.items || [];
        }
      }
      
      const allTickets = Array.isArray(data) ? data : [];
      const filtered = allTickets.filter(
        (ticket) => ticket.status === "assigned" && !ticket.acceptedAt
      );
      setTickets(filtered);
    } catch (err) {
      console.error("Failed to load waiting acceptance tickets:", err);
      setError(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Loading
        </div>
        <div style={{ color: "#6b7280" }}>Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fee2e2",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ color: "#991b1b", fontWeight: 600 }}>❌ Error</div>
        <div style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #f3f4f6" }}>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
          Tickets waiting for staff acceptance
        </p>
      </div>

      {tickets.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            No tickets waiting for acceptance
          </div>
        </div>
      ) : (
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
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
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
                  Assigned To
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
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td
                    style={{
                      padding: "1rem",
                      color: "#111827",
                      fontWeight: 500,
                    }}
                  >
                    {ticket.title}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {getPriorityBadge(ticket.priority)}
                  </td>
                  <td style={{ padding: "1rem", color: "#6b7280" }}>
                    {ticket.room?.name || "N/A"}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Overdue Tickets Tab
function OverdueTicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/v1/tickets/admin/overdue");
      let data = response?.data || response;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        data = data.tickets || data.data || data.items || [];
      }
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load overdue tickets:", err);
      setError(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Loading
        </div>
        <div style={{ color: "#6b7280" }}>Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fee2e2",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ color: "#991b1b", fontWeight: 600 }}>❌ Error</div>
        <div style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</div>
      </div>
    );
  }

  return (
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
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid rgba(243,244,246,0.6)",
        }}
      >
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
          Tickets that have exceeded their SLA deadline
        </p>
      </div>

      {tickets.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            No overdue tickets
          </div>
        </div>
      ) : (
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
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
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
                  Due Date
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
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    backgroundColor: "#fef2f2",
                  }}
                >
                  <td
                    style={{
                      padding: "1rem",
                      color: "#111827",
                      fontWeight: 500,
                    }}
                  >
                    {ticket.title}
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
                    {ticket.assignee?.username ||
                      ticket.assignee?.fullName ||
                      "N/A"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#dc2626",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(ticket.dueDate)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Status Tickets Tab
function StatusTicketsTab({ status }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSortByPriority = () => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const sorted = [...tickets].sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      return sortOrder === "asc"
        ? priorityA - priorityB
        : priorityB - priorityA;
    });
    setTickets(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/v1/tickets");

      let data = response?.data?.data || response?.data || response;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        const keys = Object.keys(data);
        if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
          data = Object.values(data);
        } else {
          data = data.tickets || data.items || [];
        }
      }

      const allTickets = Array.isArray(data) ? data : [];
      const filteredTickets = allTickets.filter(
        (ticket) => ticket.status === status
      );
      setTickets(filteredTickets);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [status]);

  const handleDelete = async (ticketId) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setNotification({
        type: "success",
        message: "Ticket deleted successfully!",
      });
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Unknown error";
      setNotification({ type: "error", message: errorMessage });
    }
  };

  const handleAssign = async (ticketId, staffId, priority) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, {
        staffId,
        priority,
      });
      setAssignModal(null);
      setNotification({
        type: "success",
        message: "Ticket assigned to staff successfully!",
      });
      await loadTickets();
    } catch (err) {
      console.error("Failed to assign ticket:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Unknown error";
      setNotification({ type: "error", message: errorMessage });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "3rem",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Loading
        </div>
        <div style={{ color: "#6b7280" }}>Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fee2e2",
          borderRadius: "12px",
          padding: "1.5rem",
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ color: "#991b1b", fontWeight: 600 }}>❌ Error</div>
        <div style={{ color: "#dc2626", marginTop: "0.5rem" }}>{error}</div>
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
                      No {status} tickets found
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
                            e.target.style.backgroundColor =
                              "rgba(59, 130, 246, 0.15)";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              "0 12px 40px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor =
                              "rgba(59, 130, 246, 0.08)";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                              "0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)";
                          }}
                        >
                          Edit
                        </button>
                        {(() => {
                          const hasNoAssignee =
                            !ticket.assignee && !ticket.assignedTo;
                          const hasOneCategory =
                            ticket.ticketCategories?.length === 1;
                          const hasDeniedReason = ticket.deniedReason;
                          const canAssign =
                            (hasNoAssignee || hasDeniedReason) &&
                            hasOneCategory;

                          return canAssign ? (
                            <button
                              type="button"
                              onClick={() => setAssignModal(ticket)}
                              style={{
                                padding: "0.5rem 1rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                                color: "#1d1d1f",
                                border: "1px solid rgba(255, 255, 255, 0.18)",
                                borderRadius: "14px",
                                cursor: "pointer",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                backdropFilter: "blur(40px) saturate(200%)",
                                boxShadow:
                                  "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                              }}
                              onMouseOver={(e) => {
                                e.target.style.backgroundColor =
                                  "rgba(255, 255, 255, 0.15)";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                  "0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.7)";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.backgroundColor =
                                  "rgba(255, 255, 255, 0.08)";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                  "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)";
                              }}
                            >
                              {hasDeniedReason ? "Reassign" : "Assign"}
                            </button>
                          ) : null;
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
                            e.target.style.backgroundColor =
                              "rgba(239, 68, 68, 0.15)";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow =
                              "0 12px 40px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor =
                              "rgba(239, 68, 68, 0.08)";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                              "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)";
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

// Notification Modal Component
function NotificationModal({ type, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "2rem",
        right: "2rem",
        zIndex: 9999,
        backgroundColor:
          type === "success"
            ? "rgba(220, 252, 231, 0.25)"
            : "rgba(254, 226, 226, 0.25)",
        border: `1px solid ${
          type === "success"
            ? "rgba(134, 239, 172, 0.3)"
            : "rgba(254, 202, 202, 0.3)"
        }`,
        borderRadius: "16px",
        padding: "1rem 1.5rem",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(40px) saturate(200%)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        minWidth: "300px",
        maxWidth: "500px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          fontSize: "1.25rem",
          flexShrink: 0,
        }}
      >
        {type === "success" ? "✅" : "❌"}
      </div>
      <div
        style={{
          flex: 1,
          color: type === "success" ? "#166534" : "#991b1b",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: type === "success" ? "#166534" : "#991b1b",
          cursor: "pointer",
          fontSize: "1.25rem",
          padding: "0",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

export default TicketManagement;
