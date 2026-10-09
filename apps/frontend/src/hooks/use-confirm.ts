import { useEffect, useState } from "react"

/**
 * Confirmación de dos clics para acciones destructivas: el primer `confirm()`
 * la arma y el segundo, antes de `timeout` ms, ejecuta `onConfirmed`. Pasado
 * el plazo vuelve sola al estado inicial.
 */
export function useConfirm(
  onConfirmed: () => unknown,
  { timeout = 3000 }: { timeout?: number } = {}
) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), timeout)
    return () => clearTimeout(timer)
  }, [confirming, timeout])

  const confirm = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    void onConfirmed()
  }

  return { confirming, confirm }
}
