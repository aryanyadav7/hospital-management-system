
import { useCallback, useState } from 'react'

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((currentValue) => !currentValue)
  }, [])

  const setOn = useCallback(() => {
    setValue(true)
  }, [])

  const setOff = useCallback(() => {
    setValue(false)
  }, [])

  return {
    value,
    toggle,
    setOn,
    setOff,
  }
}

export default useToggle
