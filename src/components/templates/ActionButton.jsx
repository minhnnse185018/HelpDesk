/**
 * ActionButton - Component button với style giống AllTickets.jsx
 * Props:
 * - variant: 'primary' | 'secondary' | 'success' | 'danger' | 'info' | 'warning'
 * - children: ReactNode - nội dung button
 * - onClick: function - handler khi click
 * - disabled: boolean - trạng thái disabled
 * - type: string - type của button (default: 'button')
 * - style: object - custom style (optional)
 */
function ActionButton({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  type = 'button',
  style = {},
}) {
  const variantStyles = {
    primary: {
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
      color: '#2563eb',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      hoverBg: 'rgba(59, 130, 246, 0.15)',
      shadow: '0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(59, 130, 246, 0.1)',
    },
    secondary: {
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      color: '#6366f1',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      hoverBg: 'rgba(99, 102, 241, 0.15)',
      shadow: '0 8px 32px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(99, 102, 241, 0.1)',
    },
    success: {
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      color: '#10b981',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      hoverBg: 'rgba(16, 185, 129, 0.15)',
      shadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(16, 185, 129, 0.1)',
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      color: '#dc2626',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      hoverBg: 'rgba(239, 68, 68, 0.15)',
      shadow: '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(239, 68, 68, 0.1)',
    },
    info: {
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      color: '#6366f1',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      hoverBg: 'rgba(99, 102, 241, 0.15)',
      shadow: '0 8px 32px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(99, 102, 241, 0.1)',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      color: '#d97706',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      hoverBg: 'rgba(245, 158, 11, 0.15)',
      shadow: '0 8px 32px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(245, 158, 11, 0.1)',
    },
  }

  const currentStyle = variantStyles[variant] || variantStyles.primary

  const baseStyle = {
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 500,
    backgroundColor: disabled ? 'rgba(156, 163, 175, 0.08)' : currentStyle.backgroundColor,
    color: disabled ? '#9ca3af' : currentStyle.color,
    border: disabled ? '1px solid rgba(156, 163, 175, 0.2)' : currentStyle.border,
    borderRadius: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(40px) saturate(200%)',
    boxShadow: disabled ? 'none' : currentStyle.shadow,
    ...style,
  }

  const handleMouseOver = (e) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = currentStyle.hoverBg
      e.currentTarget.style.transform = 'translateY(-1px)'
    }
  }

  const handleMouseOut = (e) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = currentStyle.backgroundColor
      e.currentTarget.style.transform = 'translateY(0)'
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {children}
    </button>
  )
}

export default ActionButton

