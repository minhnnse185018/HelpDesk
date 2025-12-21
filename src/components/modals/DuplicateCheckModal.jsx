import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { ActionButton } from "../templates";
import { fontSize, fontWeight } from "../../utils/fontStyles";
import { useNotificationSocket } from "../../context/NotificationSocketContext";

function DuplicateCheckModal({ ticket, onClose, onMarkDuplicate }) {
  const navigate = useNavigate();
  const { socket } = useNotificationSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [markingDuplicate, setMarkingDuplicate] = useState(null);

  useEffect(() => {
    scanDuplicates();
  }, [ticket.id]);

  const scanDuplicates = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.post(
        `/api/v1/tickets/${ticket.id}/scan-duplicate-new`
      );
      const data = response?.data?.data || response?.data || response;

      if (data.matches && Array.isArray(data.matches)) {
        // Sort by similarity (highest first)
        const sortedMatches = [...data.matches].sort(
          (a, b) => b.similarity - a.similarity
        );
        setDuplicates(sortedMatches);
        setDuplicatesCount(data.duplicatesFound || sortedMatches.length);
      } else {
        setDuplicates([]);
        setDuplicatesCount(0);
      }
    } catch (err) {
      console.error("Failed to scan duplicates:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to scan for duplicates"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDuplicate = async (duplicateTicketId) => {
    try {
      setMarkingDuplicate(duplicateTicketId);
      await apiClient.post(`/api/v1/tickets/${ticket.id}/mark-duplicate`, {
        duplicateOfTicketId: duplicateTicketId,
      });

      if (onMarkDuplicate) {
        onMarkDuplicate();
      }

      // Remove the marked duplicate from the list
      setDuplicates((prev) =>
        prev.filter((match) => match.ticket.id !== duplicateTicketId)
      );
      setDuplicatesCount((prev) => prev - 1);
    } catch (err) {
      console.error("Failed to mark duplicate:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to mark as duplicate"
      );
    } finally {
      setMarkingDuplicate(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
      assigned: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
      in_progress: { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" },
      resolved: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
      closed: { bg: "#e5e7eb", text: "#374151", border: "#d1d5db" },
      escalated: { bg: "#ffe4e6", text: "#be123c", border: "#fecdd3" },
      cancelled: { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" },
    };
    return colors[status] || colors.open;
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: "Open",
      assigned: "Assigned",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
      escalated: "Escalated",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" };
    if (similarity >= 80) return { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" };
    if (similarity >= 70) return { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" };
    return { bg: "#e5e7eb", text: "#6b7280", border: "#d1d5db" };
  };

  const canMarkAsDuplicate = (ticketStatus) => {
    const restrictedStatuses = ["escalated", "closed", "resolved"];
    return !restrictedStatuses.includes(ticketStatus?.toLowerCase());
  };

  const handleDuplicateTicketClick = async (dupTicket) => {
    try {
      // Fetch full ticket details before navigating
      const ticketRes = await apiClient.get(`/api/v1/tickets/${dupTicket.id}`);
      const fullTicket = ticketRes?.data || ticketRes;

      // Emit window event for real-time update
      window.dispatchEvent(new CustomEvent('ticket:updated', {
        detail: fullTicket
      }));

      // Emit socket event if socket is available
      if (socket) {
        socket.emit('ticket:viewed', { ticketId: fullTicket.id });
      }

      // Navigate to ticket detail page
      navigate(`/admin/tickets/${dupTicket.id}`);
      onClose(); // Close modal after navigation
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
      // Navigate anyway even if fetch fails
      navigate(`/admin/tickets/${dupTicket.id}`);
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          maxWidth: "900px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.18)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.semibold,
                  color: "#111827",
                }}
              >
                Check Duplicates
              </h3>
              <p
                style={{
                  margin: "0.5rem 0 0 0",
                  fontSize: fontSize.base,
                  color: "#6b7280",
                }}
              >
                Ticket: <strong>{ticket.title}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#6b7280",
                padding: "0",
                lineHeight: "1",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ×
            </button>
          </div>

          {duplicatesCount > 0 && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                backgroundColor: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: fontSize.xl }}>⚠️</span>
              <span style={{ fontSize: fontSize.base, color: "#92400e" }}>
                Found <strong>{duplicatesCount}</strong> potential duplicate
                {duplicatesCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          {loading ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                🔍
              </div>
              <div>Scanning for duplicates...</div>
            </div>
          ) : error ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                color: "#991b1b",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                ❌
              </div>
              <div>{error}</div>
            </div>
          ) : duplicates.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <div style={{ fontSize: fontSize['4xl'], marginBottom: "0.5rem" }}>
                ✅
              </div>
              <div style={{ fontSize: fontSize.lg, fontWeight: fontWeight.medium }}>
                No duplicates found
              </div>
              <div style={{ fontSize: fontSize.base, marginTop: "0.5rem" }}>
                This ticket appears to be unique
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {duplicates.map((match, index) => {
                const dupTicket = match.ticket;
                const similarity = match.similarity;
                const statusColor = getStatusColor(dupTicket.status);
                const similarityColor = getSimilarityColor(similarity);

                return (
                  <div
                    key={dupTicket.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s",
                      cursor: "pointer",
                    }}
                    onClick={() => handleDuplicateTicketClick(dupTicket)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.1)";
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.backgroundColor = "#ffffff";
                    }}
                  >
                    {/* Similarity Badge */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.375rem 0.75rem",
                            fontSize: fontSize.sm,
                            fontWeight: fontWeight.semibold,
                            borderRadius: "6px",
                            backgroundColor: similarityColor.bg,
                            color: similarityColor.text,
                            border: `1px solid ${similarityColor.border}`,
                          }}
                        >
                          {similarity.toFixed(2)}% Similar
                        </span>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.375rem 0.75rem",
                            fontSize: fontSize.sm,
                            fontWeight: fontWeight.semibold,
                            borderRadius: "6px",
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                          }}
                        >
                          {getStatusLabel(dupTicket.status)}
                        </span>
                      </div>
                    </div>

                    {/* Ticket Info */}
                    <div style={{ marginBottom: "1rem" }}>
                      <h4
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: fontSize.lg,
                          fontWeight: fontWeight.semibold,
                          color: "#111827",
                        }}
                      >
                        {dupTicket.title}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 0.75rem 0",
                          fontSize: fontSize.base,
                          color: "#6b7280",
                          lineHeight: "1.5",
                        }}
                      >
                        {dupTicket.description || "No description"}
                      </p>

                      {/* Ticket Details Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "0.75rem",
                          fontSize: fontSize.base,
                          color: "#6b7280",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: "#374151" }}>
                            Room:
                          </span>{" "}
                          {dupTicket.room?.name || dupTicket.room?.code || "N/A"}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: "#374151" }}>
                            Created:
                          </span>{" "}
                          {formatDate(dupTicket.createdAt)}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: "#374151" }}>
                            Creator:
                          </span>{" "}
                          {dupTicket.creator?.username ||
                            dupTicket.creator?.email ||
                            "N/A"}
                        </div>
                        {dupTicket.assignee && (
                          <div>
                            <span style={{ fontWeight: 600, color: "#374151" }}>
                              Assignee:
                            </span>{" "}
                            {dupTicket.assignee?.username ||
                              dupTicket.assignee?.email ||
                              "N/A"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "flex-end",
                        paddingTop: "1rem",
                        borderTop: "1px solid #e5e7eb",
                        alignItems: "center",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!canMarkAsDuplicate(dupTicket.status) ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "0.25rem",
                          }}
                        >
                          <ActionButton
                            variant="warning"
                            disabled={true}
                            style={{ fontSize: fontSize.base }}
                          >
                            Mark as Duplicate
                          </ActionButton>
                          <span
                            style={{
                              fontSize: fontSize.xs,
                              color: "#6b7280",
                              fontStyle: "italic",
                            }}
                          >
                            Cannot mark {getStatusLabel(dupTicket.status).toLowerCase()} tickets
                          </span>
                        </div>
                      ) : (
                        <ActionButton
                          variant="warning"
                          onClick={() => handleMarkDuplicate(dupTicket.id)}
                          disabled={markingDuplicate === dupTicket.id}
                          style={{ fontSize: fontSize.base }}
                        >
                          {markingDuplicate === dupTicket.id
                            ? "Marking..."
                            : "Mark as Duplicate"}
                        </ActionButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            position: "sticky",
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
          }}
        >
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default DuplicateCheckModal;

