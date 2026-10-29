
function Loader({
  message = 'Loading...',
  size = 'medium',
  className = '',
}) {
  const sizes = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4',
  }

  const spinnerSize = sizes[size] ?? sizes.medium

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}
    >
      <div
        className={`${spinnerSize} rounded-full border-blue-600 border-t-transparent animate-spin`}
      />

      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}

export default Loader
