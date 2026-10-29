
function Card({
  children,
  title,
  description,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-6 ${className}`}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-800">
              {title}
            </h3>
          )}

          {description && (
            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  )
}

export default Card
