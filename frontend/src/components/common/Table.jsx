
function Table({
  columns = [],
  data = [],
  rowKey = 'id',
  emptyMessage = 'No records found.',
}) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-3 font-semibold whitespace-nowrap"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(columns.length, 1)}
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                className="hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3"
                  >
                    {column.render
                      ? column.render(row)
                      : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
