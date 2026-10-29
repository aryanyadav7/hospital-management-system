
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
}) {
  if (!isOpen) {
    return null
  }

  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
  }

  const modalSize = sizes[size] ?? sizes.medium

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${modalSize} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-gray-800"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-2xl text-gray-500 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
