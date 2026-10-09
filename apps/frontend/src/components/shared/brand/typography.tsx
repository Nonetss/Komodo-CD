import { cva, type VariantProps } from "class-variance-authority"
import { createElement, type HTMLAttributes, type ReactNode } from "react"

import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    role: {
      display:
        "text-display type-semi-expanded font-extrabold tracking-[-0.03em] wrap-anywhere",
      section: "text-section font-bold tracking-[-0.02em]",
      stat: "text-stat font-extrabold tabular-nums",
      headline: "text-headline font-bold tracking-tight",
      body: "text-body",
      meta: "text-meta leading-relaxed",
      "meta-sm": "text-meta-sm",
      caption: "text-caption font-medium",
      label: "font-mono text-label font-medium tracking-widest uppercase",
      status: "font-mono text-label font-medium tracking-widest uppercase",
      data: "font-mono text-xs tabular-nums",
    },
    tone: {
      default: "",
      muted: "text-muted-foreground",
      primary: "text-primary",
      signal: "text-signal",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    role: "body",
    tone: "default",
  },
})

type TextElement =
  | "div"
  | "p"
  | "span"
  | "label"
  | "legend"
  | "dt"
  | "dd"
  | "h1"
  | "h2"
  | "h3"
  | "time"

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  as?: TextElement
  variant?: VariantProps<typeof textVariants>["role"]
  tone?: VariantProps<typeof textVariants>["tone"]
  htmlFor?: string
  dateTime?: string
  children: ReactNode
}

/**
 * API tipográfica del producto: cada texto elige un rol (título, etiqueta,
 * dato técnico…) en vez de rehacer tamaño, peso y tracking con utilidades en
 * cada sitio. El layout sigue siendo local; el lenguaje visual, no.
 */
export function Text({
  as = "span",
  variant,
  tone,
  className,
  children,
  ...props
}: TextProps) {
  return createElement(
    as,
    {
      ...props,
      className: cn(textVariants({ role: variant, tone }), className),
    },
    children
  )
}

export { textVariants }
