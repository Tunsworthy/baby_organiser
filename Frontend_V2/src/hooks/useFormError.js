import { useState, useCallback } from 'react'

export function useFormError() {
  const [error, setError] = useState(null)
  
  const handleError = useCallback((err, fallbackMsg = 'An error occurred') => {
    const message = err?.message || (typeof err === 'string' ? err : fallbackMsg)
    setError(message)
  }, [])
  
  const clearError = useCallback(() => setError(null), [])
  
  return { error, setError, handleError, clearError }
}
