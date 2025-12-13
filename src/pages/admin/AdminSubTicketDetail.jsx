import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const configs = {
    low: { bg: "#ecfdf3", text: "#166534", label: "Low" },
    medium: { bg: "#fef3c7", text: "#92400e", label: "Medium" },
    high: { bg: "#fee2e2", text: "#b91c1c", label: "High" },
    urgent: { bg: "#7f1d1d", text: "#fef2f2", label: "Urgent" },
  };
  const config = configs[priority] || {
    bg: "#f3f4f6",
    text: "#4b5563",
    label: priority,
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}

function getStatusBadge(status) {
  const configs = {
    open: { bg: "#e0f2fe", text: "#075985", label: "Open" },
    assigned: { bg: "#fef3c7", text: "#92400e", label: "Assigned" },
    in_progress: { bg: "#dbeafe", text: "#1e40af", label: "In Progress" },
    resolved: { bg: "#dcfce7", text: "#166534", label: "Resolved" },
    denied: { bg: "#fee2e2", text: "#991b1b", label: "Denied" },
  };
  const config = configs[status] || {
    bg: "#e5e7eb",
    text: "#374151",
    label: status,
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}

function AdminSubTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subTicket, setSubTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/api/v1/sub-tickets/${id}`);
      const data = response?.data || response;
      setSubTicket(data);
    } catch (err) {
      console.error("Failed to load sub-ticket:", err);
      setError(err?.message || "Failed to load sub-ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubTicket();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <p style={{ fontSize: "1rem", color: "#6b7280" }}>
          Loading sub-ticket...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>Error: {error}</p>
      </div>
    );
  }

  if (!subTicket) {
    return (
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#fef3c7",
          color: "#92400e",
          borderRadius: "0.5rem",
        }}
      >
        <p style={{ margin: 0 }}>Sub-ticket not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1.5rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#f3f4f6",
          border: "1px solid #d1d5db",
          borderRadius: "0.5rem",
          color: "#374151",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        ← Back
      </button>

      {/* Sub-Ticket Header */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 0.5rem 0",
              }}
            >
              Sub-Ticket Details
            </h2>
            <p style={{ color: "#6b7280", margin: 0, fontSize: "0.875rem" }}>
              ID: {subTicket.id}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {getStatusBadge(subTicket.status)}
            {getPriorityBadge(subTicket.priority)}
          </div>
        </div>

        {/* Parent Ticket Information */}
        {subTicket.parentTicket && (
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "#f9fafb",
              borderRadius: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#374151",
                margin: "0 0 1rem 0",
              }}
            >
              Parent Ticket
            </h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    textTransform: "uppercase",
                  }}
                >
                  Title
                </span>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    color: "#111827",
                    fontWeight: 500,
                  }}
                >
                  {subTicket.parentTicket.title}
                </p>
              </div>
              {subTicket.parentTicket.description && (
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      textTransform: "uppercase",
                    }}
                  >
                    Description
                  </span>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#374151" }}>
                    {subTicket.parentTicket.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-Ticket Information */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              Created At
            </span>
            <p style={{ margin: "0.25rem 0 0 0", color: "#111827" }}>
              {formatDate(subTicket.createdAt)}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              Assigned At
            </span>
            <p style={{ margin: "0.25rem 0 0 0", color: "#111827" }}>
              {formatDate(subTicket.assignedAt)}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              Due Date
            </span>
            <p style={{ margin: "0.25rem 0 0 0", color: "#111827" }}>
              {formatDate(subTicket.dueDate)}
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              Resolved At
            </span>
            <p style={{ margin: "0.25rem 0 0 0", color: "#111827" }}>
              {formatDate(subTicket.resolvedAt)}
            </p>
          </div>
          {subTicket.assignedTo && (
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Assigned To
              </span>
              <p style={{ margin: "0.25rem 0 0 0", color: "#111827" }}>
                {subTicket.assignedTo.fullName || subTicket.assignedTo.username}
              </p>
            </div>
          )}
        </div>

        {/* Resolution Note */}
        {subTicket.resolutionNote && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              backgroundColor: "#dcfce7",
              borderRadius: "0.5rem",
              borderLeft: "4px solid #10b981",
            }}
          >
            <h4
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#065f46",
                margin: "0 0 0.5rem 0",
              }}
            >
              Resolution Note
            </h4>
            <p style={{ fontSize: "0.875rem", color: "#065f46", margin: 0 }}>
              {subTicket.resolutionNote}
            </p>
          </div>
        )}

        {/* Denied Reason */}
        {subTicket.deniedReason && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              backgroundColor: "#fee2e2",
              borderRadius: "0.5rem",
              borderLeft: "4px solid #ef4444",
            }}
          >
            <h4
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#991b1b",
                margin: "0 0 0.5rem 0",
              }}
            >
              Denied Reason
            </h4>
            <p style={{ fontSize: "0.875rem", color: "#991b1b", margin: 0 }}>
              {subTicket.deniedReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSubTicketDetail;
