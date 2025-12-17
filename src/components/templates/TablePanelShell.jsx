/**
 * TablePanelShell - Component shell cho table panel bên trái
 * Props:
 * - loading: boolean - trạng thái loading
 * - error: string - thông báo lỗi
 * - totalCount: number - tổng số items
 * - totalLabel: string - label hiển thị (default: "Total")
 * - filterBar: ReactNode - custom filter bar content (optional)
 * - columns: array - [{ key, label }] hoặc ReactNode cho thead
 * - data: array - dữ liệu để render
 * - renderRow: function(row, index) - hàm render mỗi row
 * - onRowClick: function(row) - handler khi click row
 * - selectedId: any - id của row được chọn
 * - emptyMessage: string - message khi không có data
 * - loadingMessage: string - message khi loading
 */
function TablePanelShell({
  loading = false,
  error = '',
  totalCount = 0,
  totalLabel = 'Total',
  filterBar,
  columns = [],
  data = [],
  renderRow,
  onRowClick,
  selectedId,
  emptyMessage = 'No items found.',
  loadingMessage = 'Loading...',
}) {
  const renderTableHeader = () => {
    if (columns.length === 0) return null
    
    // Nếu columns là array of objects với key và label
    if (Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'object' && columns[0].key) {
      return (
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
      )
    }
    
    // Nếu columns là ReactNode (custom header)
    return <thead>{columns}</thead>
  }

  const renderTableBody = () => {
    if (loading) {
      const colSpan = Array.isArray(columns) && columns.length > 0 
        ? columns.length 
        : 1
      return (
        <tbody>
          <tr>
            <td colSpan={colSpan}>{loadingMessage}</td>
          </tr>
        </tbody>
      )
    }

    if (data.length === 0) {
      const colSpan = Array.isArray(columns) && columns.length > 0 
        ? columns.length 
        : 1
      return (
        <tbody>
          <tr>
            <td colSpan={colSpan}>{emptyMessage}</td>
          </tr>
        </tbody>
      )
    }

    return (
      <tbody>
        {data.map((row, index) => {
          if (renderRow) {
            return renderRow(row, index)
          }

          // Default render nếu không có renderRow và columns là array of objects
          if (Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'object' && columns[0].key) {
            return (
              <tr
                key={row.id || index}
                className={selectedId === row.id ? 'row-selected' : ''}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key] || '—'}</td>
                ))}
              </tr>
            )
          }

          // Nếu không có renderRow và columns không phải array of objects, không render gì
          return null
        })}
      </tbody>
    )
  }

  return (
    <div className="table-panel">
      <div className="filter-bar">
        <div className="filter-bar-main">
          {filterBar || (
            <span className="filter-hint">
              {totalLabel}: {totalCount}
            </span>
          )}
        </div>
        {error && <div className="form-error">{error}</div>}
      </div>

      <div className="card table-card">
        <table className="table">
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>
    </div>
  )
}

export default TablePanelShell

