export default function FoodTable({ items, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8">Loading items...</div>
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
        No food items yet. Add your first item to get started!
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Category</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {item.quantity} {item.unit || ''}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                  {item.category || 'Other'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                {item.notes || '-'}
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
