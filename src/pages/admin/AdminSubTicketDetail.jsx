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

function AdminSubTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subTicket, setSubTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePopup, setImagePopup] = useState(null);

  const loadSubTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/api/v1/sub-tickets/${id}`);
      const data = response?.data || response;
      
      // Fetch category details if categoryId exists
      if (data.categoryId && !data.category) {
        try {
          const catRes = await apiClient.get(`/api/v1/categories/${data.categoryId}`);
          data.category = catRes.data || catRes;
        } catch (err) {
          console.error("Failed to fetch category:", err);
        }
      }
      
      // Fetch department details from assignee
      if (data.assignee?.departmentId && !data.department) {
        try {
          const deptRes = await apiClient.get(`/api/v1/departments/${data.assignee.departmentId}`);
          data.department = deptRes.data || deptRes;
        } catch (err) {
          console.error("Failed to fetch department:", err);
        }
      }
      
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
          minHeight: "100vh",
          backgroundColor: "#f5f5f7",
          padding: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          Loading sub-ticket details...
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

  if (!subTicket) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f7",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          Sub-ticket not found
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(subTicket.status);
  const priorityColor = subTicket.priority ? getPriorityColor(subTicket.priority) : null;

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
                {subTicket.status?.toUpperCase() || "N/A"}
              </span>
              {subTicket.priority && (
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
                  {subTicket.priority.toUpperCase()}
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
              {subTicket.parentTicket?.title || "Sub-Ticket Details"}
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
                  {subTicket.parentTicket?.description || "No description provided"}
                </p>
              </div>

              {/* Attachments from Parent Ticket */}
              {subTicket.parentTicket?.attachments && subTicket.parentTicket.attachments.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: "0.75rem",
                    }}
                  >
                    📎 Attachments ({subTicket.parentTicket.attachments.length})
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "1.25rem",
                    }}
                  >
                    {subTicket.parentTicket.attachments.map((attachment) => {
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

              {/* Resolution Note */}
              {subTicket.resolutionNote && (
                <div
                  style={{
                    marginBottom: "2rem",
                    padding: "1.25rem",
                    backgroundColor: "#dcfce7",
                    borderRadius: "0.75rem",
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
                    ✓ Resolution Note
                  </h4>
                  <p style={{ fontSize: "0.875rem", color: "#065f46", margin: 0, whiteSpace: "pre-wrap" }}>
                    {subTicket.resolutionNote}
                  </p>
                </div>
              )}

              {/* Denied Reason */}
              {subTicket.deniedReason && (
                <div
                  style={{
                    marginBottom: "2rem",
                    padding: "1.25rem",
                    backgroundColor: "#fee2e2",
                    borderRadius: "0.75rem",
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
                    ✗ Denied Reason
                  </h4>
                  <p style={{ fontSize: "0.875rem", color: "#991b1b", margin: 0, whiteSpace: "pre-wrap" }}>
                    {subTicket.deniedReason}
                  </p>
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
                {/* Assigned To */}
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
                  <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0, fontWeight: 500 }}>
                    {subTicket.assignee?.username || subTicket.assignee?.email || "N/A"}
                  </p>
                  {subTicket.assignee?.fullName && (
                    <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0.125rem 0 0 0" }}>
                      {subTicket.assignee.fullName}
                    </p>
                  )}
                </div>

                {/* Room */}
                {subTicket.parentTicket?.room && (
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
                      {subTicket.parentTicket.room.name} {subTicket.parentTicket.room.code && `(${subTicket.parentTicket.room.code})`} {subTicket.parentTicket.room.floor && `- Floor ${subTicket.parentTicket.room.floor}`}
                    </p>
                  </div>
                )}

                {/* Department */}
                {subTicket.department && (
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
                      {subTicket.department.name} {subTicket.department.code && `(${subTicket.department.code})`}
                    </p>
                  </div>
                )}

                {/* Category */}
                {subTicket.category && (
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
                      Category
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {subTicket.category.name}
                    </p>
                  </div>
                )}

                {/* Created At */}
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
                    {formatDate(subTicket.createdAt)}
                  </p>
                </div>

                {/* Assigned At */}
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
                    Assigned At
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                    {formatDate(subTicket.assignedAt)}
                  </p>
                </div>

                {/* Due Date */}
                {subTicket.dueDate && (
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
                    <p style={{ 
                      fontSize: "0.875rem", 
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
                      Accepted At
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#111827", margin: 0 }}>
                      {formatDate(subTicket.acceptedAt)}
                    </p>
                  </div>
                )}

                {/* Escalated At */}
                {subTicket.escalatedAt && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#dc2626",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      ⚠️ Escalated At
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#dc2626", margin: 0, fontWeight: 500 }}>
                      {formatDate(subTicket.escalatedAt)}
                    </p>
                  </div>
                )}

                {/* Resolved At */}
                {subTicket.resolvedAt && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#059669",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      ✓ Resolved At
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#059669", margin: 0, fontWeight: 500 }}>
                      {formatDate(subTicket.resolvedAt)}
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

export default AdminSubTicketDetail;
