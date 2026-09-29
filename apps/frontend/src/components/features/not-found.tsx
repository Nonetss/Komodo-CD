import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { withIsland } from "@/providers/island"

const NotFoundContent = () => {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-6">
      <div
        className="bg-grid absolute inset-0 opacity-40 mask-[radial-gradient(ellipse_at_center,black_10%,transparent_60%)]"
        aria-hidden
      />
      <div className="reveal relative max-w-sm space-y-5 text-center">
        <p className="section-label">HTTP 404</p>
        <p className="font-display text-7xl font-semibold tracking-tighter">
          404
        </p>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">{t("notFound.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("notFound.description")}
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/stacks">
            <ArrowLeft />
            {t("notFound.back")}
          </a>
        </Button>
      </div>
    </div>
  )
}

export const NotFound = withIsland(NotFoundContent)
