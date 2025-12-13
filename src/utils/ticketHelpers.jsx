export function formatDate(dateString) {
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

export function getPriorityBadge(priority) {
  if (!priority) return "-";
  const configs = {
    low: { text: "#065f46", label: "Low" },
    medium: { text: "#92400e", label: "Medium" },
    high: { text: "#b91c1c", label: "High" },
    critical: { text: "#7f1d1d", label: "Critical" },
  };
  const config = configs[priority] || { text: "#4b5563", label: priority };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}

export function getStatusBadge(status) {
  const configs = {
    open: { text: "#1e40af", label: "Open" },
    assigned: { text: "#92400e", label: "Assigned" },
    in_progress: { text: "#075985", label: "In Progress" },
    resolved: { text: "#166534", label: "Resolved" },
    closed: { text: "#374151", label: "Closed" },
    overdue: { text: "#991b1b", label: "Overdue" },
  };
  const config = configs[status] || { text: "#374151", label: status };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}
