import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Tamaños por rol definidos en global.css (@theme). Sin esto, tailwind-merge
// los toma por colores y descarta `text-label` al lado de `text-muted-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: { text: ["title", "heading", "label", "micro"] },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
