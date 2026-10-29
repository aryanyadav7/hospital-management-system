
import Button from '../ui/Button'

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-4 mt-4">
      <p className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default Pagination
