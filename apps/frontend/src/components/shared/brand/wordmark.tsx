import { cn } from "@/lib/utils"

/**
 * Marca de la app: «KOMODO/CD» en negrita. Los lectores de pantalla
 * leen el nombre sin la barra.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-base leading-none font-bold tracking-tight whitespace-nowrap",
        className
      )}
    >
      <span aria-hidden>KOMODO/CD</span>
      <span className="sr-only">Komodo CD</span>
    </span>
  )
}
