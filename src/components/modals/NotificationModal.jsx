import { fontSize } from '../../utils/fontStyles';

function NotificationModal({ type, message, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 9999,
        animation: "slideIn 0.3s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          padding: "1rem 1.5rem",
          borderRadius: "12px",
          backgroundColor: type === "success" ? "#dcfce7" : "#fee2e2",
          border: `1px solid ${type === "success" ? "#86efac" : "#fecaca"}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          cursor: "pointer",
          minWidth: "300px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: fontSize.xl }}>
            {type === "success" ? "✅" : "❌"}
          </span>
          <div>
            <div
              style={{
                fontWeight: 600,
                color: type === "success" ? "#166534" : "#991b1b",
                marginBottom: "0.25rem",
              }}
            >
              {type === "success" ? "Success" : "Error"}
            </div>
            <div
              style={{
                fontSize: fontSize.base,
                color: type === "success" ? "#15803d" : "#dc2626",
              }}
            >
              {message}
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

export default NotificationModal;
