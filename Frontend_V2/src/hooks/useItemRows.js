import { useState, useCallback } from 'react'

export function useItemRows(initialValue = [{ food_id: '', quantity: 1 }]) {
  const [items, setItems] = useState(initialValue)
  
  const addRow = useCallback(() => {
    setItems(s => [...s, { food_id: '', quantity: 1 }])
  }, [])
  
  const removeRow = useCallback((idx) => {
    setItems(s => s.filter((_, i) => i !== idx))
  }, [])
  
  const updateRow = useCallback((idx, key, value) => {
    setItems(s => s.map((r, i) => i === idx ? { ...r, [key]: value } : r))
  }, [])
  
  const reset = useCallback(() => {
    setItems([{ food_id: '', quantity: 1 }])
  }, [])
  
  return { items, setItems, addRow, removeRow, updateRow, reset }
}
