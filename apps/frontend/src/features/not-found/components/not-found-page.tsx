import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { Button } from "@/components/ui/button"
import { withIsland } from "@/providers/island"

const NotFoundPageContent = () => {
  const { t } = useTranslation()
  return (
    <div className="bg-dot-grid relative flex min-h-dvh items-center justify-center px-6">
      <div className="bg-background relative max-w-sm space-y-5 rounded-xl border px-8 py-10 text-center">
        <p className="text-primary font-mono text-6xl font-bold tracking-tight">
          404
        </p>
        <div className="space-y-1">
          <Text as="h1" variant="headline">
            {t("notFound.title")}
          </Text>
          <Text as="p" tone="muted" className="text-pretty">
            {t("notFound.description")}
          </Text>
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

export const NotFoundPage = withIsland(NotFoundPageContent)
