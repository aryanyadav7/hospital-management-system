
import Modal from './Modal'
import Button from '../ui/Button'

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
}) {
  const handleConfirm = () => {
    if (!loading) {
      onConfirm?.()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={title}
      size="small"
    >
      <p className="text-gray-600">
        {message}
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>

        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait...' : confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
