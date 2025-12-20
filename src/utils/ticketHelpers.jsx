export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  
  // Format: MM/DD/YYYY, HH:MM AM/PM
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');
  
  return `${month}/${day}/${year}, ${formattedHours}:${minutes} ${ampm}`;
}

// Status color helper - consistent across all components
export function getStatusColor(status) {
  const colors = {
    open: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    assigned: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    in_progress: { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" },
    resolved: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
    denied: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    closed: { bg: "#e5e7eb", text: "#374151", border: "#d1d5db" },
    escalated: { bg: "#fef2f2", text: "#b91c1c", border: "#fecdd3" },
  };
  return colors[status] || { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
}

// Priority color helper - consistent across all components
export function getPriorityColor(priority) {
  const colors = {
    low: { bg: "#dbeafe", text: "#1e40af" },
    medium: { bg: "#fef3c7", text: "#92400e" },
    high: { bg: "#fed7aa", text: "#9a3412" },
    critical: { bg: "#fecaca", text: "#991b1b" },
  };
  return colors[priority] || { bg: "#f3f4f6", text: "#374151" };
}

export function getPriorityBadge(priority) {
  if (!priority) return "-";
  const colorConfig = getPriorityColor(priority);
  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 500,
        padding: "0.375rem 0.875rem",
        borderRadius: "9999px",
        backgroundColor: colorConfig.bg,
        color: colorConfig.text,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {priority.toUpperCase()}
    </span>
  );
}

export function getStatusBadge(status) {
  if (!status) return "-";
  const colorConfig = getStatusColor(status);
  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 500,
        padding: "0.375rem 0.875rem",
        borderRadius: "9999px",
        backgroundColor: colorConfig.bg,
        color: colorConfig.text,
        border: `1px solid ${colorConfig.border}`,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}
