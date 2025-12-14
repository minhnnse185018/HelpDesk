import { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { formatDate } from "../../utils/ticketHelpers.jsx";
import SplitCategoriesModal from "../../components/modals/SplitCategoriesModal";
import NotificationModal from "../../components/modals/NotificationModal";

function PendingSplitTickets({ searchTerm = "" }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [splitModal, setSplitModal] = useState(null);
  const [notification, setNotification] = useState(null);

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

      // Filter tickets that need splitting
      ticketsArray = ticketsArray.filter(
        (ticket) =>
          ticket.status === "open" &&
          Array.isArray(ticket.ticketCategories) &&
          ticket.ticketCategories.length >= 2
      );

      setTickets(ticketsArray);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSplit = async (ticketId, splits) => {
    try {
      await apiClient.post(`/api/v1/tickets/${ticketId}/split-categories`, { splits });
      setNotification({ type: "success", message: "Ticket split successfully!" });
      setSplitModal(null);
      loadTickets();
    } catch (err) {
      console.error("Failed to split:", err);
      setNotification({ type: "error", message: "Failed to split ticket" });
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

  // Filter tickets based on search term
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      ticket.title?.toLowerCase().includes(search) ||
      ticket.description?.toLowerCase().includes(search) ||
      ticket.creator?.username?.toLowerCase().includes(search) ||
      ticket.creator?.email?.toLowerCase().includes(search) ||
      ticket.room?.name?.toLowerCase().includes(search) ||
      ticket.ticketCategories?.some(tc => tc.category?.name?.toLowerCase().includes(search))
    );
  });

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
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                        {searchTerm ? "No tickets match your search" : "No pending split tickets found"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
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
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.15)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.08)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        Split Categories
                      </button>
                    </td>
                  </tr>
                  ))
                )}
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

export default PendingSplitTickets;
