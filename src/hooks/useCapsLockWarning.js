import { useCallback, useState } from 'react'

export function useCapsLockWarning() {
  const [capsLockOn, setCapsLockOn] = useState(false)

  const handlePasswordKeyEvent = useCallback((event) => {
    const caps = event.getModifierState && event.getModifierState('CapsLock')
    setCapsLockOn(Boolean(caps))
  }, [])

  const resetCapsLock = useCallback(() => {
    setCapsLockOn(false)
  }, [])

  return { capsLockOn, handlePasswordKeyEvent, resetCapsLock }
}

export default useCapsLockWarning
