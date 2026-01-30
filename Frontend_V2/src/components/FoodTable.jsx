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
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Unit</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Last Served</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date Prepared</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Type</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isAvailable = item.quantity > 0
            const lastServed = item.lastallocated ? item.lastallocated.split('T')[0] : '-'
            const datePrepared = item.dateprepared ? item.dateprepared.split('T')[0] : '-'
            
            return (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-block px-3 py-1 rounded text-white text-xs font-medium ${isAvailable ? 'bg-green-600' : 'bg-red-600'}`}>
                    {isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.unit || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{lastServed}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{datePrepared}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs capitalize">
                    {item.type || 'Other'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{item.notes || '-'}</td>
                <td className="px-6 py-4 text-sm space-x-3">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
