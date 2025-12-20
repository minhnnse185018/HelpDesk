/**
 * WarningMessage - Reusable warning message component
 * 
 * Props:
 * - message: string - warning message to display
 * - icon: string - optional icon (default: "⚠️")
 * - style: object - optional custom styles
 * - className: string - optional CSS class name
 */
function WarningMessage({ 
  message, 
  icon = '⚠️',
  style = {},
  className = ''
}) {
  if (!message) return null

  return (
    <div
      className={className}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: 'rgba(234, 179, 8, 0.08)',
        border: '1px solid rgba(234, 179, 8, 0.2)',
        borderRadius: '8px',
        color: '#ca8a04',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginTop: '0.5rem',
        ...style
      }}
    >
      <span style={{ 
        fontSize: '1rem', 
        flexShrink: 0,
        marginTop: '0.125rem'
      }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>
        {message}
      </span>
    </div>
  )
}

export default WarningMessage

