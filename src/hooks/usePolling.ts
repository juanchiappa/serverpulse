import { useEffect, useRef } from 'react'

export function usePolling(callback: () => void, intervalMs: number) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    callbackRef.current()

    const id = setInterval(() => {
      callbackRef.current()
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs])
}