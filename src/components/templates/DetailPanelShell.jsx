/**
 * DetailPanelShell - Component shell cho detail panel bên phải
 * Props:
 * - title: string - tiêu đề panel
 * - subtitle: string - subtitle (optional)
 * - selectedItem: object - item được chọn để hiển thị
 * - emptyMessage: string - message khi chưa chọn item
 * - children: ReactNode - nội dung form/details
 * - onDelete: function - handler khi click delete (optional)
 * - deleting: boolean - trạng thái đang xóa
 * - updating: boolean - trạng thái đang update
 * - actionError: string - lỗi từ action
 * - dangerZoneTitle: string - title cho danger zone (default: "Danger Zone")
 * - dangerZoneContent: ReactNode - custom danger zone content (optional)
 */
function DetailPanelShell({
  title = 'Details',
  subtitle,
  selectedItem,
  emptyMessage = 'Select an item to view details.',
  children,
  onDelete,
  deleting = false,
  updating = false,
  actionError = '',
  dangerZoneTitle = 'Danger Zone',
  dangerZoneContent,
}) {
  return (
    <aside className="detail-panel">
      <div className="card detail-card">
        <h3 className="detail-title">{title}</h3>
        {selectedItem ? (
          <>
            {subtitle && (
              <p className="detail-subtitle">
                {typeof subtitle === 'function' ? subtitle(selectedItem) : subtitle}
              </p>
            )}
            {children}
            {(onDelete || dangerZoneContent) && (
              <div className="detail-section">
                <h4 className="detail-section-title">{dangerZoneTitle}</h4>
                {dangerZoneContent || (
                  <button
                    type="button"
                    className="btn btn-secondary subtle"
                    onClick={onDelete}
                    disabled={deleting || updating}
                  >
                    {deleting ? 'Deleting...' : `Delete ${title}`}
                  </button>
                )}
              </div>
            )}
            {actionError && <div className="form-error">{actionError}</div>}
          </>
        ) : (
          <p>{emptyMessage}</p>
        )}
      </div>
    </aside>
  )
}

export default DetailPanelShell

