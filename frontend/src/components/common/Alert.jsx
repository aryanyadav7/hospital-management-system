
function Alert({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const alertStyle = styles[type] ?? styles.info

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`border rounded-lg p-4 flex items-start justify-between gap-3 ${alertStyle} ${className}`}
    >
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="font-bold hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default Alert
