import { useState } from "react";
import AllTickets from "./AllTickets";
import StatusTickets from "./StatusTickets";
import PendingSplitTickets from "./PendingSplitTickets";
import WaitingAcceptanceTickets from "./WaitingAcceptanceTickets";
import OverdueTickets from "./OverdueTickets";
import SubTickets from "./SubTickets";
import AdminReassignRequests from "./AdminReassignRequests";

function TicketManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { key: "all", label: "All Tickets" },
    { key: "sub-tickets", label: "Sub-Tickets" },
    { key: "open", label: "Open" },
    { key: "assigned", label: "Assigned" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
    // { key: "closed", label: "Closed" },
    { key: "pending-split", label: "Pending Split" },
    // { key: "waiting-acceptance", label: "Waiting Acceptance" },
    { key: "overdue", label: "Overdue" },
    { key: "reassign-requests", label: "Reassign Requests" }
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

        {/* Search Bar */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ position: "relative", maxWidth: "500px" }}>
            <input
              type="text"
              placeholder="Search tickets by title, description, creator, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
                fontSize: "0.875rem",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "white",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
            <svg
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1.125rem",
                height: "1.125rem",
                color: "#9ca3af",
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
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
        {activeTab === "all" && <AllTickets searchTerm={searchTerm} />}
        {activeTab === "open" && <StatusTickets status="open" searchTerm={searchTerm} />}
        {activeTab === "assigned" && <StatusTickets status="assigned" searchTerm={searchTerm} />}
        {activeTab === "in_progress" && (
          <StatusTickets status="in_progress" searchTerm={searchTerm} />
        )}
        {activeTab === "resolved" && <StatusTickets status="resolved" searchTerm={searchTerm} />}
        {activeTab === "closed" && <StatusTickets status="closed" searchTerm={searchTerm} />}
        {activeTab === "pending-split" && <PendingSplitTickets searchTerm={searchTerm} />}
        {/* {activeTab === "waiting-acceptance" && <WaitingAcceptanceTickets searchTerm={searchTerm} />} */}
        {activeTab === "overdue" && <OverdueTickets searchTerm={searchTerm} />}
        {activeTab === "sub-tickets" && <SubTickets searchTerm={searchTerm} />}
        {activeTab === "reassign-requests" && <AdminReassignRequests searchTerm={searchTerm} />}
      </div>
    </div>
  );
}

export default TicketManagement;
