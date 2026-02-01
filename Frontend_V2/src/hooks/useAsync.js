import { useState, useCallback, useEffect } from 'react'

export function useAsync(asyncFn, immediate = true) {
  const [state, setState] = useState({
    loading: immediate,
    data: null,
    error: null
  })

  const execute = useCallback(async () => {
    setState({ loading: true, error: null, data: null })
    try {
      const result = await asyncFn()
      setState({ loading: false, data: result, error: null })
      return result
    } catch (err) {
      const errorMsg = err?.message || 'An error occurred'
      setState({ loading: false, error: errorMsg, data: null })
      throw err
    }
  }, [asyncFn])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { ...state, execute }
}
