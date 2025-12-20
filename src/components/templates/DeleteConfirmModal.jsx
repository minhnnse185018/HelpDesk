import ActionButton from './ActionButton'

/**
 * DeleteConfirmModal - Component shell cho modal xác nhận xóa
 * Props:
 * - isOpen: boolean - trạng thái mở/đóng modal
 * - onClose: function - handler khi đóng modal
 * - onConfirm: function - handler khi xác nhận xóa
 * - deleting: boolean - trạng thái đang xóa
 * - title: string - tiêu đề modal (default: "Delete Item")
 * - message: string - message xác nhận (default: "Are you sure you want to delete this item?")
 * - warningMessage: string - warning message (optional)
 * - itemInfo: object - thông tin item để hiển thị (optional)
 * - renderItemInfo: function(itemInfo) - custom render item info (optional)
 * - itemLabel: string - label cho item (default: "item")
 */
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  deleting = false,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item?',
  warningMessage,
  itemInfo,
  renderItemInfo,
  itemLabel = 'item',
}) {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !deleting) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          {warningMessage && (
            <p className="modal-warning">
              <strong>Warning:</strong> {warningMessage}
            </p>
          )}
          {itemInfo && (
            <div className="modal-user-info">
              {renderItemInfo ? (
                renderItemInfo(itemInfo)
              ) : (
                Object.entries(itemInfo).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                    {value || '—'}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <ActionButton
            variant="secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : `Delete ${itemLabel}`}
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal

