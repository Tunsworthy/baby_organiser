import { useForm } from 'react-hook-form'
import { useState } from 'react'

export default function FoodForm({ onSubmit, isLoading, initialData, onCancel }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {}
  })
  const [submitError, setSubmitError] = useState(null)

  const handleFormSubmit = async (data) => {
    try {
      setSubmitError(null)
      await onSubmit(data)
      reset()
    } catch (err) {
      setSubmitError(err.message || 'Error submitting form')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {submitError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          {...register('name', { required: 'Name is required' })}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Baby Porridge"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity
        </label>
        <input
          {...register('quantity', { required: 'Quantity is required', valueAsNumber: true })}
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 5"
          min="0"
        />
        {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unit
        </label>
        <input
          {...register('unit')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., oz, ml, packs"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Served
        </label>
        <input
          {...register('lastallocated')}
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date Prepared
        </label>
        <input
          {...register('dateprepared', { required: 'Date Prepared is required' })}
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.dateprepared && <p className="text-red-500 text-sm mt-1">{errors.dateprepared.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          {...register('type', { required: 'Type is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select type</option>
          <option value="protein">Protein</option>
          <option value="fish">Fish</option>
          <option value="vegetable">Vegetable</option>
          <option value="fruit">Fruit</option>
          <option value="grain">Grain</option>
          <option value="dairy">Dairy</option>
        </select>
        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          {...register('notes')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes..."
          rows="3"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Item' : 'Add Item'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
        >
          {isLoading ? 'Saving...' : 'Save Item'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
