import { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { formatDate, getPriorityBadge } from "../../utils/ticketHelpers.jsx";

function WaitingAcceptanceTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      // Filter tickets waiting for staff acceptance
      ticketsArray = ticketsArray.filter((ticket) => ticket.status === "assigned");

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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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

export default WaitingAcceptanceTickets;
