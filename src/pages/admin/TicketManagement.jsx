import { useState } from "react";
import AllTickets from "./AllTickets";
import StatusTickets from "./StatusTickets";
import PendingSplitTickets from "./PendingSplitTickets";
import WaitingAcceptanceTickets from "./WaitingAcceptanceTickets";
import OverdueTickets from "./OverdueTickets";

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
    { key: "Sub_Ticket", }
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
        {activeTab === "all" && <AllTickets />}
        {activeTab === "open" && <StatusTickets status="open" />}
        {activeTab === "assigned" && <StatusTickets status="assigned" />}
        {activeTab === "in_progress" && (
          <StatusTickets status="in_progress" />
        )}
        {activeTab === "resolved" && <StatusTickets status="resolved" />}
        {activeTab === "closed" && <StatusTickets status="closed" />}
        {activeTab === "pending-split" && <PendingSplitTickets />}
        {activeTab === "waiting-acceptance" && <WaitingAcceptanceTickets />}
        {activeTab === "overdue" && <OverdueTickets />}
      </div>
    </div>
  );
}

export default TicketManagement;
