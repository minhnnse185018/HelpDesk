/**
 * PageShell - Component shell cho page header
 * Props:
 * - title: Tiêu đề trang (required)
 * - subtitle: Mô tả phụ (optional)
 * - actions: ReactNode hoặc array các button elements (optional)
 * - children: Nội dung chính của trang
 */
function PageShell({ title, subtitle, actions, children }) {
  return (
    <div className="page page-with-panel">
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {Array.isArray(actions) ? actions.map((action, idx) => (
              <div key={idx}>{action}</div>
            )) : actions}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export default PageShell

