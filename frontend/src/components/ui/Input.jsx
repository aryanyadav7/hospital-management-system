
function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  className = '',
}) {
  const inputId = name || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      />

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

export default Input
