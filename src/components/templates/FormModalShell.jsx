import ActionButton from './ActionButton'

/**
 * FormModalShell - Component shell cho modal form create/edit
 * Props:
 * - isOpen: boolean - trạng thái mở/đóng modal
 * - onClose: function - handler khi đóng modal
 * - title: string - tiêu đề modal
 * - onSubmit: function(e) - handler khi submit form
 * - submitting: boolean - trạng thái đang submit
 * - submitLabel: string - label cho button submit (default: "Submit")
 * - cancelLabel: string - label cho button cancel (default: "Cancel")
 * - children: ReactNode - nội dung form
 * - error: string - thông báo lỗi
 * - footerButtons: ReactNode - custom footer buttons (optional, sẽ override default)
 * - size: 'small' | 'medium' | 'large' - kích thước modal (default: 'medium')
 */
function FormModalShell({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitting = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  children,
  error = '',
  footerButtons,
  size = 'medium',
}) {
  if (!isOpen) return null

  const sizeClasses = {
    small: { maxWidth: '400px' },
    medium: { maxWidth: '600px' },
    large: { maxWidth: '800px' },
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={sizeClasses[size]}
      >
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {children}
            {error && <div className="form-error">{error}</div>}
          </div>
          <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            {footerButtons || (
              <>
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  {cancelLabel}
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : submitLabel}
                </ActionButton>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormModalShell

