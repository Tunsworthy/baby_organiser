export default function ErrorAlert({ message, onDismiss, className = '' }) {
  if (!message) return null
  
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center ${className}`}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-600 hover:text-red-800 font-bold ml-2">
          ✕
        </button>
      )}
    </div>
  )
}
