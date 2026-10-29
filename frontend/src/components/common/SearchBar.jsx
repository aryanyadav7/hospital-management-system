
function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) {
  return (
    <div className={`w-full ${className}`}>
      <label htmlFor="reusable-search" className="sr-only">
        Search
      </label>

      <input
        id="reusable-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default SearchBar
