
function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error = '',
  className = '',
}) {
  const selectId = name || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

export default Select
    