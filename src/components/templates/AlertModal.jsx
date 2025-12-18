import ActionButton from './ActionButton'

/**
 * AlertModal - Reusable alert modal component
 * 
 * Props:
 * - isOpen: boolean - controls modal visibility
 * - onClose: function - handler to close modal
 * - message: string - message to display
 * - title: string - modal title (default: "Notice")
 * - type: 'info' | 'success' | 'error' | 'warning' - modal type (default: 'info')
 */
function AlertModal({ 
  isOpen, 
  onClose, 
  message, 
  title = 'Notice',
  type = 'info'
}) {
  if (!isOpen) return null

  const typeConfig = {
    info: {
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.2)',
      text: '#1e40af',
      icon: 'ℹ️'
    },
    success: {
      bg: 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.2)',
      text: '#16a34a',
      icon: '✅'
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
      text: '#dc2626',
      icon: '❌'
    },
    warning: {
      bg: 'rgba(234, 179, 8, 0.08)',
      border: 'rgba(234, 179, 8, 0.2)',
      text: '#ca8a04',
      icon: '⚠️'
    }
  }

  const config = typeConfig[type] || typeConfig.info

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '1.5rem',
          margin: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${config.border}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          marginBottom: '1rem', 
          fontSize: '1.125rem', 
          fontWeight: 600, 
          textAlign: 'center',
          color: config.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>{config.icon}</span>
          <span>{title}</span>
        </div>
        <div style={{ 
          marginBottom: '1.5rem', 
          color: '#374151', 
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ActionButton
            variant={type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'}
            onClick={onClose}
            style={{ minWidth: '100px' }}
          >
            OK
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

export default AlertModal

