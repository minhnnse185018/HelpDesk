import { useEffect, useState } from "react";
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
  const configs = {
    low: { className: "status-new", label: "Low" },
    medium: { className: "status-in-progress", label: "Medium" },
    high: { className: "status-overdue", label: "High" },
    critical: { className: "status-overdue", label: "Critical" },
  };
  const config = configs[priority] || {
    className: "status-new",
    label: priority,
  };
  return (
    <span className={`status-badge ${config.className}`}>{config.label}</span>
  );
}

function getStatusBadge(status) {
  const configs = {
    assigned: { className: "status-in-progress", label: "Assigned" },
    in_progress: { className: "status-in-progress", label: "In Progress" },
    resolved: { className: "status-resolved", label: "Resolved" },
    denied: { className: "status-overdue", label: "Denied" },
  };
  const config = configs[status] || { className: "status-new", label: status };
  return (
    <span className={`status-badge ${config.className}`}>{config.label}</span>
  );
}

function StaffDashboard() {
  const navigate = useNavigate();
  const [workload, setWorkload] = useState(null);
  const [subTickets, setSubTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getCurrentStaffId = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || payload.userId || payload.id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const staffId = getCurrentStaffId();
        if (!staffId) {
          throw new Error("Unable to get staff ID from token");
        }

        const [workloadRes, subTicketsRes] = await Promise.all([
          apiClient.get(`/api/v1/tickets/staff/${staffId}/workload`),
          apiClient.get("/api/v1/sub-tickets/assigned-to-me"),
        ]);

        const workloadData = workloadRes?.data || workloadRes;
        setWorkload(workloadData);

        const subTicketsData = subTicketsRes?.data || subTicketsRes;
        const activeSubTickets = Array.isArray(subTicketsData)
          ? subTicketsData
              .filter(
                (st) => st.status === "assigned" || st.status === "in_progress"
              )
              .slice(0, 5)
          : [];
        setSubTickets(activeSubTickets);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(err?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
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
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Staff Dashboard</h2>
          <p className="page-subtitle">Overview of your workload and tasks</p>
        </div>
      </div>

      <section className="section">
        <div className="cards-grid">
          <div className="card kpi-card">
            <p className="kpi-label">Active Tickets</p>
            <p className="kpi-value">{workload?.totalActive || 0}</p>
          </div>
          <div className="card kpi-card">
            <p className="kpi-label">Critical Priority</p>
            <p className="kpi-value">{workload?.criticalCount || 0}</p>
          </div>
          <div className="card kpi-card">
            <p className="kpi-label">High Priority</p>
            <p className="kpi-value">{workload?.highCount || 0}</p>
          </div>
          <div className="card kpi-card">
            <p className="kpi-label">Overdue</p>
            <p className="kpi-value">{workload?.overdueCount || 0}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h3 className="section-title">Active Sub-Tickets</h3>
        </div>

        {subTickets.length === 0 ? (
          <div
            className="card"
            style={{ padding: "2rem", textAlign: "center" }}
          >
            <p style={{ color: "#6b7280" }}>
              No active sub-tickets at the moment.
            </p>
          </div>
        ) : (
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Parent Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subTickets.map((st) => (
                  <tr key={st.id}>
                    <td>{st.parentTicket?.title || "N/A"}</td>
                    <td>{st.category?.name || "N/A"}</td>
                    <td>{getPriorityBadge(st.priority)}</td>
                    <td>{getStatusBadge(st.status)}</td>
                    <td>{formatDate(st.dueDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/staff/sub-tickets/${st.id}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default StaffDashboard;
