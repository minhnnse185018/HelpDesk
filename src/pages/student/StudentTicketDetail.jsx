import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { ActionButton, DeleteConfirmModal } from "../../components/templates";
import { downloadFile } from "../../utils/fileDownload";
import { formatDate, getStatusColor } from "../../utils/ticketHelpers.jsx";


function getStatusConfig(status) {
  const map = {
    open: { label: "Open", bg: "#dbeafe", text: "#1e40af" },
    assigned: { label: "Assigned", bg: "#fef3c7", text: "#92400e" },
    in_progress: { label: "In Progress", bg: "#e0f2fe", text: "#075985" },
    escalated: { label: "Escalated", bg: "#fee2e2", text: "#991b1b" },
    resolved: { label: "Resolved", bg: "#dcfce7", text: "#166534" },
    closed: { label: "Closed", bg: "#e5e7eb", text: "#374151" },
    cancelled: { label: "Cancelled", bg: "#f3f4f6", text: "#4b5563" },
    duplicate: { label: "Duplicate", bg: "#f5f3ff", text: "#4c1d95" },
    reopened: { label: "Reopened", bg: "#ede9fe", text: "#5b21b6" },
  };
  return (
    map[status] || {
      label: status || "Unknown",
      bg: "#e5e7eb",
      text: "#374151",
    }
  );
}

function getPriorityConfig(priority) {
  const map = {
    low: { label: "Low", bg: "#ecfdf3", text: "#166534" },
    medium: { label: "Medium", bg: "#fef3c7", text: "#92400e" },
    high: { label: "High", bg: "#fee2e2", text: "#b91c1c" },
    critical: {
      label: "Critical",
      bg: "#7f1d1d",
      text: "#fef2f2",
      border: "#fecaca",
    },
  };
  return map[priority] || null;
}

function StudentTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePopup, setImagePopup] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const formatRoom = (room) => {
    if (!room) return "N/A";
    const name = room.name || "";
    const codePart = room.code ? `code (${room.code})` : "";
    const floorPart =
      room.floor !== undefined && room.floor !== null
        ? `Floor ${room.floor}`
        : "";
    if (!codePart && !floorPart) return name || "N/A";
    return `${name}\n${[codePart, floorPart].filter(Boolean).join(" ")}`.trim();
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      open: "New",
      assigned: "Assigned",
      accepted: "In Progress",
      in_progress: "In Progress",
      denied: "Denied",
      resolved: "Resolved",
      closed: "Closed",
      escalated: "Escalated",
    };
    return statusMap[status] || status;
  };


  const getCategoryNames = (ticketCategories) => {
    if (!ticketCategories || ticketCategories.length === 0) return "N/A";
    return ticketCategories
      .map((tc) => tc.category?.name || "Unknown")
      .join(", ");
  };

  const enrichTicketData = useCallback(async (rawTicket) => {
    if (!rawTicket) return rawTicket;
    const hydrated = { ...rawTicket };

    if (
      hydrated.roomId &&
      (!hydrated.room ||
        hydrated.room.code === undefined ||
        hydrated.room.floor === undefined)
    ) {
      try {
        const roomRes = await apiClient.get(`/api/v1/rooms/${hydrated.roomId}`);
        hydrated.room = {
          ...(hydrated.room || {}),
          ...(roomRes?.data || roomRes),
        };
      } catch (err) {
        console.error("Failed to fetch room details:", err);
      }
    }

    if (
      hydrated.departmentId &&
      (!hydrated.department || !hydrated.department.name)
    ) {
      try {
        const deptRes = await apiClient.get(
          `/api/v1/departments/${hydrated.departmentId}`
        );
        hydrated.department = deptRes?.data || deptRes;
      } catch (err) {
        console.error("Failed to fetch department details:", err);
      }
    }

    if (
      Array.isArray(hydrated.ticketCategories) &&
      hydrated.ticketCategories.length > 0
    ) {
      hydrated.ticketCategories = await Promise.all(
        hydrated.ticketCategories.map(async (tc) => {
          if (tc.category || !tc.categoryId) return tc;
          try {
            const catRes = await apiClient.get(
              `/api/v1/categories/${tc.categoryId}`
            );
            return { ...tc, category: catRes?.data || catRes };
          } catch (err) {
            console.error("Failed to fetch category details:", err);
            return tc;
          }
        })
      );
    }

    if (Array.isArray(hydrated.subTickets) && hydrated.subTickets.length > 0) {
      hydrated.subTickets = await Promise.all(
        hydrated.subTickets.map(async (sub) => {
          const nextSub = { ...sub };

          if (sub.categoryId && !sub.category) {
            try {
              const catRes = await apiClient.get(
                `/api/v1/categories/${sub.categoryId}`
              );
              nextSub.category = catRes?.data || catRes;
            } catch (err) {
              console.error("Failed to fetch sub-ticket category:", err);
            }
          }

          if (sub.roomId && !sub.room) {
            try {
              const roomRes = await apiClient.get(`/api/v1/rooms/${sub.roomId}`);
              nextSub.room = roomRes?.data || roomRes;
            } catch (err) {
              console.error("Failed to fetch sub-ticket room:", err);
            }
          }

          if (sub.departmentId && !sub.department) {
            try {
              const deptRes = await apiClient.get(
                `/api/v1/departments/${sub.departmentId}`
              );
              nextSub.department = deptRes?.data || deptRes;
            } catch (err) {
              console.error("Failed to fetch sub-ticket department:", err);
            }
          }

          return nextSub;
        })
      );
    }

    return hydrated;
  }, []);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/api/v1/tickets/${id}`);
      const data = response?.data || response;
      const hydrated = await enrichTicketData(data);
      setTicket(hydrated);
    } catch (err) {
      console.error("Failed to load ticket details:", err);
      setError(err?.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [enrichTicketData, id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleBack = () => {
    navigate("/student/my-tickets");
  };

  const isAttachmentImage = (attachment) => {
    if (!attachment) return false;
    const mimeFlag = attachment.mimeType?.startsWith("image/");
    const nameOrPath = `${attachment.fileName || ""} ${
      attachment.filePath || ""
    }`;
    const extFlag = /\.(png|jpe?g|webp|gif|bmp)$/i.test(nameOrPath);
    return Boolean(mimeFlag || extFlag);
  };

  const handleAttachmentClick = (attachment) => {
    if (!attachment || !isAttachmentImage(attachment)) return;
    setImagePopup(attachment);
  };

  const openImagePopup = (attachment) => {
    setImagePopup(attachment);
  };

  const closeImagePopup = () => {
    setImagePopup(null);
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      await apiClient.delete(`/api/v1/tickets/${ticketId}`);
      navigate("/student/my-tickets");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete ticket"
      );
      console.error("Failed to delete ticket:", err);
      throw err;
    }
  };

  const shortId = ticket?.id ? ticket.id.slice(0, 8) : "";
  const statusCfg = ticket ? getStatusConfig(ticket.status) : null;
  const priorityCfg =
    ticket && ticket.priority ? getPriorityConfig(ticket.priority) : null;

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 className="page-title">Ticket Details</h2>
          {ticket && (
            <p className="page-subtitle" style={{ marginTop: "0.25rem" }}>
              #{shortId} - Created at {formatDate(ticket.createdAt)}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <ActionButton
            variant="secondary"
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </ActionButton>

        </div>
      </div>

      {loading && (
        <div className="card" style={{ padding: "1.5rem" }}>
          Loading ticket details...
        </div>
      )}

      {!loading && error && (
        <div
          className="card"
          style={{
            padding: "1.5rem",
            borderLeft: "4px solid #dc2626",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && ticket && (
        <div
          className="section"
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Header content */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  {ticket.title}
                </h3>
                <div
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  {statusCfg && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: statusCfg.bg,
                        color: statusCfg.text,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  )}
                  {priorityCfg && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: priorityCfg.bg,
                        color: priorityCfg.text,
                        border: priorityCfg.border
                          ? `1px solid ${priorityCfg.border}`
                          : "none",
                      }}
                    >
                      Priority: {priorityCfg.label}
                    </span>
                  )}
                  {ticket.isDuplicate && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        backgroundColor: "#f5f3ff",
                        color: "#4c1d95",
                      }}
                    >
                      Duplicate
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Details Card */}
          <div className="card" style={{ padding: "1.5rem" }}>
            {/* Info Grid */}
            <div
              style={{
                display: "grid",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.25rem",
                  }}
                >
                  Category
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#111827",
                  }}
                >
                  {getCategoryNames(ticket.ticketCategories)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.25rem",
                  }}
                >
                  Room
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#111827",
                  }}
                >
                  {formatRoom(ticket.room)
                    .split("\n")
                    .map((line, idx) => (
                      <span key={idx}>
                        {line}
                        {idx === 0 && <br />}
                      </span>
                    ))}
                </p>
              </div>
              {ticket.department && (
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Department
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    {ticket.department.name}
                  </p>
                </div>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Created
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Due Date
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    {formatDate(ticket.dueDate)}
                  </p>
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "0.25rem",
                  }}
                >
                  Status
                </p>
                {(() => {
                  const statusColor = getStatusColor(ticket.status);
                  return (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        padding: "0.375rem 0.875rem",
                        borderRadius: "9999px",
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        display: "inline-block",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Description */}
            <div
              style={{
                marginBottom: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "0.75rem",
                }}
              >
                Description
              </h4>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#374151",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6",
                }}
              >
                {ticket.description || "No description provided"}
              </p>
            </div>

            {/* Images - Grid Layout */}
            {(() => {
              const images = ticket.attachments?.filter((attachment) =>
                isAttachmentImage(attachment)
              );
              return (
                images &&
                images.length > 0 && (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      paddingTop: "1.5rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Images ({images.length})
                    </h4>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      {images.map((attachment) => (
                        <div
                          key={attachment.id}
                          onClick={() => openImagePopup(attachment)}
                          style={{
                            position: "relative",
                            aspectRatio: "1",
                            backgroundColor: "#f9fafb",
                            borderRadius: "8px",
                            overflow: "hidden",
                            cursor: "pointer",
                            border: "1px solid #e5e7eb",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 6px rgba(0,0,0,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <img
                            src={attachment.filePath}
                            alt={attachment.fileName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              );
            })()}

            {/* Other Attachments (Non-images) */}
            {(() => {
              const otherFiles = ticket.attachments?.filter(
                (attachment) => !isAttachmentImage(attachment)
              );
              return (
                otherFiles &&
                otherFiles.length > 0 && (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      paddingTop: "1.5rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Attachments ({otherFiles.length})
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {otherFiles.map((attachment) => (
                        <button
                          key={attachment.id}
                          onClick={() =>
                            downloadFile(attachment.filePath, attachment.fileName)
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem",
                            backgroundColor: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textAlign: "left",
                            width: "100%",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#d1d5db";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                            e.currentTarget.style.borderColor = "#e5e7eb";
                          }}
                        >
                          <div
                            style={{
                              width: "2.5rem",
                              height: "2.5rem",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontSize: "1.25rem" }}>📄</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                color: "#111827",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {attachment.fileName}
                            </p>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#6b7280",
                                margin: "0.25rem 0 0 0",
                              }}
                            >
                              {attachment.fileSize
                                ? `${(attachment.fileSize / 1024).toFixed(2)} KB`
                                : "Unknown size"}
                            </p>
                          </div>
                          <span
                            style={{
                              fontSize: "0.875rem",
                              color: "#3b82f6",
                              flexShrink: 0,
                            }}
                          >
                            ⬇️ Download
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              );
            })()}

            {/* Sub-tickets */}
            {Array.isArray(ticket.subTickets) &&
              ticket.subTickets.length > 0 && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Sub-tickets ({ticket.subTickets.length})
                  </h4>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: "#f9fafb",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Category
                          </th>
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Assignee
                          </th>
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Priority
                          </th>
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Due Date
                          </th>
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Resolved At
                          </th>
                          <th
                            style={{
                              padding: "0.75rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Resolution Note
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticket.subTickets.map((subTicket) => {
                          const statusColor = getStatusColor(subTicket.status);
                          return (
                            <tr
                              key={subTicket.id}
                              style={{ borderBottom: "1px solid #f3f4f6" }}
                            >
                              <td
                                style={{
                                  padding: "0.75rem",
                                  fontSize: "0.875rem",
                                  color: "#111827",
                                }}
                              >
                                {subTicket.category?.name || "N/A"}
                              </td>
                              <td
                                style={{
                                  padding: "0.75rem",
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {subTicket.assignee?.username ||
                                  subTicket.assignee?.email ||
                                  "Unassigned"}
                              </td>
                              <td
                                style={{
                                  padding: "0.75rem",
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {subTicket.priority
                                  ? subTicket.priority.toUpperCase()
                                  : "-"}
                              </td>
                              <td style={{ padding: "0.75rem" }}>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    padding: "0.375rem 0.875rem",
                                    borderRadius: "9999px",
                                    backgroundColor: statusColor.bg,
                                    color: statusColor.text,
                                    border: `1px solid ${statusColor.border}`,
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {getStatusLabel(subTicket.status)}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "0.75rem",
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {formatDate(subTicket.dueDate)}
                              </td>
                              <td
                                style={{
                                  padding: "0.75rem",
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {formatDate(subTicket.resolvedAt)}
                              </td>
                              <td
                                style={{
                                  padding: "0.75rem",
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {subTicket.resolutionNote || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Timeline */}
            <div
              style={{
                paddingTop: "1.5rem",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "1rem",
                }}
              >
                Timeline
              </h4>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Created */}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        marginTop: "0.375rem",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        Ticket Created
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginTop: "0.125rem",
                        }}
                      >
                        {formatDate(ticket.createdAt)} ·{" "}
                        {ticket.creator?.username || ticket.creator?.email}
                      </p>
                    </div>
                  </div>

                  {/* Assigned */}
                  {ticket.assignedAt && (
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#f59e0b",
                          marginTop: "0.375rem",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          Assigned
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginTop: "0.125rem",
                          }}
                        >
                          {formatDate(ticket.assignedAt)} ·{" "}
                          {ticket.assignee?.username ||
                            ticket.assignee?.email ||
                            "System"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Accepted */}
                  {ticket.acceptedAt && (
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#6366f1",
                          marginTop: "0.375rem",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          Accepted
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginTop: "0.125rem",
                          }}
                        >
                          {formatDate(ticket.acceptedAt)} ·{" "}
                          {ticket.assignee?.username || ticket.assignee?.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Started */}
                  {ticket.startedAt && (
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#8b5cf6",
                          marginTop: "0.375rem",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          Started
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginTop: "0.125rem",
                          }}
                        >
                          {formatDate(ticket.startedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resolved */}
                  {ticket.resolvedAt && (
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          marginTop: "0.375rem",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          Resolved
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginTop: "0.125rem",
                          }}
                        >
                          {formatDate(ticket.resolvedAt)}
                        </p>
                        {ticket.resolutionNote && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#374151",
                              marginTop: "0.25rem",
                              fontStyle: "italic",
                            }}
                          >
                            {ticket.resolutionNote}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Closed */}
                  {ticket.closedAt && (
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#6b7280",
                          marginTop: "0.375rem",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          Closed
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginTop: "0.125rem",
                          }}
                        >
                          {formatDate(ticket.closedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Denied */}
                  {ticket.status === "denied" && ticket.deniedReason && (
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#ef4444",
                          marginTop: "0.375rem",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          Denied
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            marginTop: "0.125rem",
                          }}
                        >
                          Reason: {ticket.deniedReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delete Button */}

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (deleteConfirm) {
            try {
              await handleDeleteTicket(deleteConfirm.id);
              setDeleteConfirm(null);
            } catch (err) {
              // Error already handled in handleDeleteTicket
            }
          }
        }}
        deleting={false}
        title="Delete Ticket?"
        message={`Are you sure you want to delete the ticket "${deleteConfirm?.title}"?`}
        warningMessage="This action cannot be undone."
        itemInfo={
          deleteConfirm
            ? {
                Title: deleteConfirm.title,
              }
            : null
        }
        itemLabel="Ticket"
      />

      {/* Image Popup Modal */}
      {imagePopup && (
        <div
          onClick={closeImagePopup}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "2rem",
          }}
        >
          <button
            onClick={closeImagePopup}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "3rem",
              height: "3rem",
              color: "white",
              fontSize: "2rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              lineHeight: "1",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            ×
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={imagePopup.filePath}
              alt={imagePopup.fileName}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              }}
            />

            <div
              style={{
                marginTop: "1.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "white",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                }}
              >
                {imagePopup.fileName}
              </p>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.75rem",
                }}
              >
                {(imagePopup.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>

              <button
                onClick={() =>
                  downloadFile(imagePopup.filePath, imagePopup.fileName)
                }
                style={{
                  display: "inline-block",
                  marginTop: "0.75rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2563eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#3b82f6";
                }}
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTicketDetail;
