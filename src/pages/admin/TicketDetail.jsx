import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePopup, setImagePopup] = useState(null);

  useEffect(() => {
    loadTicketDetail();
  }, [id]);

  const loadTicketDetail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/tickets/${id}`);
      const ticketData = response.data;
      
      console.log('🎫 Ticket data:', ticketData);
      
      // Fetch room details if only ID is provided
      if (ticketData.roomId && !ticketData.room?.name) {
        try {
          const roomRes = await apiClient.get(`/api/v1/rooms/${ticketData.roomId}`);
          ticketData.room = roomRes.data || roomRes;
          console.log('🏠 Room data fetched:', ticketData.room);
        } catch (err) {
          console.error('Failed to fetch room details:', err);
        }
      }
      
      // Fetch department details if only ID is provided
      if (ticketData.departmentId && !ticketData.department?.name) {
        try {
          const deptRes = await apiClient.get(`/api/v1/departments/${ticketData.departmentId}`);
          ticketData.department = deptRes.data || deptRes;
          console.log('🏢 Department data fetched:', ticketData.department);
        } catch (err) {
          console.error('Failed to fetch department details:', err);
        }
      }
      
      // Fetch category details for each ticketCategory
      if (ticketData.ticketCategories && ticketData.ticketCategories.length > 0) {
        try {
          const categoryPromises = ticketData.ticketCategories.map(async (tc) => {
            if (tc.categoryId && !tc.category) {
              try {
                const catRes = await apiClient.get(`/api/v1/categories/${tc.categoryId}`);
                tc.category = catRes.data || catRes;
                console.log(' Category data fetched:', tc.category);
              } catch (err) {
                console.error(`Failed to fetch category ${tc.categoryId}:`, err);
              }
            }
            return tc;
          });
          
          await Promise.all(categoryPromises);
        } catch (err) {
          console.error('Failed to fetch categories:', err);
        }
      }
      
      setTicket(ticketData);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load ticket details");
      console.error("Error loading ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
      assigned: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
      in_progress: { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" },
      resolved: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
      closed: { bg: "#e5e7eb", text: "#374151", border: "#d1d5db" },
      denied: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    };
    return colors[status] || colors.open;
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

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f7",
          padding: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          Loading ticket details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f7",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            backgroundColor: "#fee2e2",
            padding: "1rem",
            borderRadius: "0.5rem",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f7",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          Ticket not found
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(ticket.status);
  const priorityColor = ticket.priority ? getPriorityColor(ticket.priority) : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            cursor: "pointer",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#374151",
          }}
        >
          ← Back
        </button>

        {/* Main Content */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "0.75rem",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <span
                style={{
                  padding: "0.375rem 0.875rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderRadius: "9999px",
                  backgroundColor: statusColor.bg,
                  color: statusColor.text,
                  border: `1px solid ${statusColor.border}`,
                }}
              >
                {ticket.status.toUpperCase()}
              </span>
              {ticket.priority && (
                <span
                  style={{
                    padding: "0.375rem 0.875rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "9999px",
                    backgroundColor: priorityColor.bg,
                    color: priorityColor.text,
                  }}
                >
                  {ticket.priority.toUpperCase()}
                </span>
              )}
            </div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 0.5rem 0",
              }}
            >
              {ticket.title}
            </h1>

          </div>

          {/* Two Column Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "2rem",
            }}
          >
            {/* Left Column */}
            <div>
              {/* Description */}
              <div style={{ marginBottom: "2rem" }}>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "0.75rem",
                  }}
                >
                  Description
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#374151",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {ticket.description || "No description provided"}
                </p>
              </div>

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: "0.75rem",
                    }}
                  >
                    📎 Attachments ({ticket.attachments.length})
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "1.25rem",
                    }}
                  >
                    {ticket.attachments.map((attachment) => {
                      const isImage = attachment.mimeType?.startsWith("image/");
                      return (
                        <div
                          key={attachment.id}
                          style={{
                            position: "relative",
                            borderRadius: "0.75rem",
                            overflow: "hidden",
                            border: "2px solid #e5e7eb",
                            cursor: isImage ? "pointer" : "default",
                            transition: "all 0.3s ease",
                            backgroundColor: "white",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          }}
                          onClick={() => isImage && setImagePopup(attachment)}
                          onMouseEnter={(e) => {
                            if (isImage) {
                              e.currentTarget.style.transform = "translateY(-4px)";
                              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
                              e.currentTarget.style.borderColor = "#3b82f6";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isImage) {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                              e.currentTarget.style.borderColor = "#e5e7eb";
                            }
                          }}
                        >
                          {isImage ? (
                            <>
                              <div style={{ position: "relative", paddingTop: "75%", backgroundColor: "#f9fafb" }}>
                                <img
                                  src={attachment.filePath}
                                  alt={attachment.fileName}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#fee2e2;color:#991b1b;font-size:0.875rem;">❌ Failed to load</div>';
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  position: "absolute",
                                  top: "0.5rem",
                                  right: "0.5rem",
                                  backgroundColor: "rgba(0,0,0,0.7)",
                                  color: "white",
                                  borderRadius: "6px",
                                  padding: "0.25rem 0.5rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                🔍 View
                              </div>
                            </>
                          ) : (
                            <div
                              style={{
                                height: "200px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#f9fafb",
                                gap: "0.5rem",
                              }}
                            >
                              <span style={{ fontSize: "3rem" }}>📄</span>
                              <a
                                href={attachment.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#3b82f6",
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  textDecoration: "none",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Download
                              </a>
                            </div>
                          )}
                          <div
                            style={{
                              padding: "0.75rem",
                              backgroundColor: "white",
                              borderTop: "1px solid #e5e7eb",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                color: "#374151",
                                margin: "0 0 0.25rem 0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={attachment.fileName}
                            >
                              {attachment.fileName}
                            </p>
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "#9ca3af",
                                margin: 0,
                              }}
                            >
                              {attachment.fileSize ? `${(parseInt(attachment.fileSize) / 1024).toFixed(1)} KB` : "Unknown size"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Tickets */}
              {ticket.subTickets && ticket.subTickets.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Sub-Tickets ({ticket.subTickets.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {ticket.subTickets.map((subTicket, index) => {
                      const subStatusColor = getStatusColor(subTicket.status);
                      const subPriorityColor = getPriorityColor(subTicket.priority);
                      return (
                        <div
                          key={subTicket.id}
                          style={{
                            padding: "1.25rem",
                            backgroundColor: "#f9fafb",
                            borderRadius: "0.75rem",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          {/* Sub-ticket header */}
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            marginBottom: "1rem",
                            paddingBottom: "0.75rem",
                            borderBottom: "1px solid #e5e7eb"
                          }}>
                            <span style={{ 
                              fontSize: "0.875rem", 
                              fontWeight: 600, 
                              color: "#374151" 
                            }}>
                              Sub-Ticket #{index + 1}
                            </span>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <span
                                style={{
                                  padding: "0.25rem 0.75rem",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  borderRadius: "9999px",
                                  backgroundColor: subStatusColor.bg,
                                  color: subStatusColor.text,
                                }}
                              >
                                {subTicket.status?.toUpperCase() || "N/A"}
                              </span>
                              <span
                                style={{
                                  padding: "0.25rem 0.75rem",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  borderRadius: "9999px",
                                  backgroundColor: subPriorityColor.bg,
                                  color: subPriorityColor.text,
                                }}
                              >
                                {subTicket.priority?.toUpperCase() || "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Sub-ticket details grid */}
                          <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(2, 1fr)", 
                            gap: "1rem" 
                          }}>
                            {/* Assigned To */}
                            <div>
                              <p style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.25rem 0",
                              }}>
                                Assigned To
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "#111827", margin: 0, fontWeight: 500 }}>
                                {subTicket.assignee?.username || subTicket.assignee?.email || "N/A"}
                              </p>
                              {subTicket.assignee?.fullName && (
                                <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0.125rem 0 0 0" }}>
                                  {subTicket.assignee.fullName}
                                </p>
                              )}
                            </div>

                            {/* Category */}
                            <div>
                              <p style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.25rem 0",
                              }}>
                                Category
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "#111827", margin: 0, fontWeight: 500 }}>
                                {subTicket.category?.name || `Category ID: ${subTicket.categoryId?.slice(0, 8)}...` || "N/A"}
                              </p>
                            </div>

                            {/* Room (from parent ticket) */}
                            {ticket.room && (
                              <div>
                                <p style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0 0 0.25rem 0",
                                }}>
                                  Room
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "#111827", margin: 0, fontWeight: 500 }}>
                                  {ticket.room.name} {ticket.room.code && `(${ticket.room.code})`} {ticket.room.floor && `- Floor ${ticket.room.floor}`}
                                </p>
                              </div>
                            )}

                            {/* Created At */}
                            <div>
                              <p style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.25rem 0",
                              }}>
                                Created At
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "#111827", margin: 0 }}>
                                {formatDate(subTicket.createdAt)}
                              </p>
                            </div>

                            {/* Assigned At */}
                            <div>
                              <p style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.25rem 0",
                              }}>
                                Assigned At
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "#111827", margin: 0 }}>
                                {formatDate(subTicket.assignedAt)}
                              </p>
                            </div>

                            {/* Due Date */}
                            {subTicket.dueDate && (
                              <div>
                                <p style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0 0 0.25rem 0",
                                }}>
                                  Due Date
                                </p>
                                <p style={{ 
                                  fontSize: "0.8rem", 
                                  color: new Date(subTicket.dueDate) < new Date() ? "#dc2626" : "#111827", 
                                  margin: 0,
                                  fontWeight: new Date(subTicket.dueDate) < new Date() ? 600 : 400
                                }}>
                                  {formatDate(subTicket.dueDate)}
                                  {new Date(subTicket.dueDate) < new Date() && " (Overdue)"}
                                </p>
                              </div>
                            )}

                            {/* Accepted At */}
                            {subTicket.acceptedAt && (
                              <div>
                                <p style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "#6b7280",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0 0 0.25rem 0",
                                }}>
                                  Accepted At
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "#111827", margin: 0 }}>
                                  {formatDate(subTicket.acceptedAt)}
                                </p>
                              </div>
                            )}

                            {/* Escalated At */}
                            {subTicket.escalatedAt && (
                              <div>
                                <p style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "#dc2626",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0 0 0.25rem 0",
                                }}>
                                  ⚠️ Escalated At
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "#dc2626", margin: 0, fontWeight: 500 }}>
                                  {formatDate(subTicket.escalatedAt)}
                                </p>
                              </div>
                            )}

                            {/* Resolved At */}
                            {subTicket.resolvedAt && (
                              <div>
                                <p style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: "#059669",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "0 0 0.25rem 0",
                                }}>
                                  ✓ Resolved At
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "#059669", margin: 0, fontWeight: 500 }}>
                                  {formatDate(subTicket.resolvedAt)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Resolution Note */}
                          {subTicket.resolutionNote && (
                            <div style={{
                              marginTop: "1rem",
                              padding: "0.75rem",
                              backgroundColor: "#dcfce7",
                              borderRadius: "0.5rem",
                              border: "1px solid #86efac"
                            }}>
                              <p style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#166534",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.25rem 0",
                              }}>
                                Resolution Note
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "#166534", margin: 0, whiteSpace: "pre-wrap" }}>
                                {subTicket.resolutionNote}
                              </p>
                            </div>
                          )}

                          {/* Denied Reason */}
                          {subTicket.deniedReason && (
                            <div style={{
                              marginTop: "1rem",
                              padding: "0.75rem",
                              backgroundColor: "#fee2e2",
                              borderRadius: "0.5rem",
                              border: "1px solid #fca5a5"
                            }}>
                              <p style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#991b1b",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.25rem 0",
                              }}>
                                Denied Reason
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "#991b1b", margin: 0, whiteSpace: "pre-wrap" }}>
                                {subTicket.deniedReason}
                              </p>
                            </div>
                          )}

                          {/* Sub-ticket Attachments */}
                          {subTicket.attachments && subTicket.attachments.length > 0 && (
                            <div style={{ marginTop: "1rem" }}>
                              <p style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.5rem 0",
                              }}>
                                📎 Attachments ({subTicket.attachments.length})
                              </p>
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                                gap: "0.75rem",
                              }}>
                                {subTicket.attachments.map((attachment) => {
                                  const isImage = attachment.mimeType?.startsWith("image/");
                                  return (
                                    <div
                                      key={attachment.id}
                                      style={{
                                        position: "relative",
                                        borderRadius: "0.5rem",
                                        overflow: "hidden",
                                        border: "1px solid #e5e7eb",
                                        cursor: isImage ? "pointer" : "default",
                                        transition: "all 0.2s ease",
                                        backgroundColor: "white",
                                      }}
                                      onClick={() => isImage && setImagePopup(attachment)}
                                      onMouseEnter={(e) => {
                                        if (isImage) {
                                          e.currentTarget.style.transform = "translateY(-2px)";
                                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                                          e.currentTarget.style.borderColor = "#3b82f6";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (isImage) {
                                          e.currentTarget.style.transform = "translateY(0)";
                                          e.currentTarget.style.boxShadow = "none";
                                          e.currentTarget.style.borderColor = "#e5e7eb";
                                        }
                                      }}
                                    >
                                      {isImage ? (
                                        <>
                                          <div style={{ position: "relative", paddingTop: "75%", backgroundColor: "#f9fafb" }}>
                                            <img
                                              src={attachment.filePath}
                                              alt={attachment.fileName}
                                              loading="lazy"
                                              onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.parentElement.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#fee2e2;color:#991b1b;font-size:0.75rem;">❌ Failed</div>';
                                              }}
                                              style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                              }}
                                            />
                                          </div>
                                          <div
                                            style={{
                                              position: "absolute",
                                              top: "0.25rem",
                                              right: "0.25rem",
                                              backgroundColor: "rgba(0,0,0,0.6)",
                                              color: "white",
                                              borderRadius: "4px",
                                              padding: "0.125rem 0.375rem",
                                              fontSize: "0.625rem",
                                              fontWeight: 600,
                                            }}
                                          >
                                            🔍
                                          </div>
                                        </>
                                      ) : (
                                        <div
                                          style={{
                                            height: "100px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#f9fafb",
                                            gap: "0.25rem",
                                          }}
                                        >
                                          <span style={{ fontSize: "2rem" }}>📄</span>
                                          <a
                                            href={attachment.filePath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              color: "#3b82f6",
                                              fontSize: "0.7rem",
                                              fontWeight: 500,
                                              textDecoration: "none",
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Download
                                          </a>
                                        </div>
                                      )}
                                      <div
                                        style={{
                                          padding: "0.5rem",
                                          backgroundColor: "white",
                                          borderTop: "1px solid #e5e7eb",
                                        }}
                                      >
                                        <p
                                          style={{
                                            fontSize: "0.7rem",
                                            fontWeight: 500,
                                            color: "#374151",
                                            margin: 0,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                          title={attachment.fileName}
                                        >
                                          {attachment.fileName}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Info */}
            <div>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      margin: "0 0 0.25rem 0",
                    }}
                  >
                    Created By
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                    {ticket.creator?.username || ticket.creator?.email || "N/A"}
                  </p>
                </div>

                {ticket.assignee && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Assigned To
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {ticket.assignee.username || ticket.assignee.email || "N/A"}
                    </p>
                  </div>
                )}

                {ticket.room && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Room
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {ticket.room.name} ({ticket.room.code}) - Floor {ticket.room.floor}
                    </p>
                  </div>
                )}

                {ticket.department && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Department
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {ticket.department.name} ({ticket.department.code})
                    </p>
                  </div>
                )}

                {ticket.ticketCategories && ticket.ticketCategories.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Categories
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {ticket.ticketCategories.map((tc) => tc.category?.name).join(", ")}
                    </p>
                  </div>
                )}

                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      margin: "0 0 0.25rem 0",
                    }}
                  >
                    Created At
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>

                {ticket.dueDate && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Due Date
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {formatDate(ticket.dueDate)}
                    </p>
                  </div>
                )}

                {ticket.resolvedAt && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Resolved At
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {formatDate(ticket.resolvedAt)}
                    </p>
                  </div>
                )}

                {ticket.resolutionNote && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Resolution Note
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#111827",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {ticket.resolutionNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Popup */}
        {imagePopup && (
          <div
            onClick={() => setImagePopup(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "2rem",
              animation: "fadeIn 0.2s ease",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setImagePopup(null)}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                width: "3.5rem",
                height: "3.5rem",
                color: "white",
                fontSize: "2rem",
                cursor: "pointer",
                lineHeight: "1",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ×
            </button>

            {/* Image Container */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "95%",
                maxHeight: "95%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
              }}
            >
              <img
                src={imagePopup.filePath}
                alt={imagePopup.fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "85vh",
                  objectFit: "contain",
                  borderRadius: "12px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}
              />
              
              {/* Image Info Footer */}
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(20px)",
                  padding: "1.25rem 2rem",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  minWidth: "300px",
                }}
              >
                <p
                  style={{
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  {imagePopup.fileName}
                </p>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                  }}
                >
                  {imagePopup.fileSize ? `${(parseInt(imagePopup.fileSize) / 1024).toFixed(1)} KB` : ""}
                </p>
                
                {/* Download Button */}
                <a
                  href={imagePopup.filePath}
                  download={imagePopup.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  ⬇️ Download Image
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketDetail;
