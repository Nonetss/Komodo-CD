import { cn } from "@/lib/utils"

/**
 * Marca de la app: «KOMODO/CD» en Archivo expandido. Los lectores de pantalla
 * leen el nombre sin la barra.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "type-expanded text-base leading-none font-extrabold tracking-[-0.01em] whitespace-nowrap",
        className
      )}
    >
      <span aria-hidden>KOMODO/CD</span>
      <span className="sr-only">Komodo CD</span>
    </span>
  )
}
