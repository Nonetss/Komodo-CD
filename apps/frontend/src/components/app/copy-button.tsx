import { Check, Copy } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CopyButtonProps = {
  value: string
  /** Muestra "Copiar"/"Copiado" junto al icono */
  withLabel?: boolean
  className?: string
  size?: "xs" | "icon-xs" | "icon-sm" | "sm"
}

export function CopyButton({
  value,
  withLabel = false,
  className,
  size,
}: CopyButtonProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size ?? (withLabel ? "xs" : "icon-xs")}
      onClick={copy}
      aria-label={copied ? t("common.copied") : t("common.copy")}
      className={cn(copied && "text-success hover:text-success", className)}
    >
      {copied ? <Check /> : <Copy />}
      {withLabel && (copied ? t("common.copied") : t("common.copy"))}
    </Button>
  )
}
