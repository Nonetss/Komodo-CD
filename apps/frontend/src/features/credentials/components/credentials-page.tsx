import { PlugZap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { PageHero } from "@/components/shared/layout/page-hero"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConnectionForm } from "@/features/credentials/components/connection-form"
import { ConnectionGuide } from "@/features/credentials/components/connection-guide"
import { ConnectionSummary } from "@/features/credentials/components/connection-summary"
import { NtfySection } from "@/features/credentials/components/ntfy-section"
import { useCredentials } from "@/features/credentials/hooks/use-credentials"
import { withIsland } from "@/providers/island"

const CredentialsPageContent = () => {
  const { t } = useTranslation()
  const credentialsQuery = useCredentials()
  const credential = credentialsQuery.data?.[0]
  const [editing, setEditing] = useState(false)

  let main: React.ReactNode
  if (credentialsQuery.isError) {
    main = (
      <QueryErrorCard
        query={credentialsQuery}
        title={t("credentials.errorLoad")}
      />
    )
  } else if (credentialsQuery.isLoading) {
    main = (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 rounded-none" />
      </div>
    )
  } else if (credential && !editing) {
    main = (
      <ConnectionSummary
        credential={credential}
        onReplace={() => setEditing(true)}
      />
    )
  } else if (!credential && !editing) {
    main = (
      <StateCard
        icon={PlugZap}
        title={t("credentials.empty")}
        description={t("credentials.emptyDescription")}
        action={
          <Button icon={PlugZap} onClick={() => setEditing(true)}>
            {t("credentials.add")}
          </Button>
        }
      />
    )
  } else {
    main = (
      <ConnectionForm
        replacing={!!credential}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        surface="credentials"
        title={t("credentials.title")}
        description={t("credentials.description")}
      />
      <div className="flex flex-col gap-10">
        <div className="min-w-0">{main}</div>
        <ConnectionGuide />
        <NtfySection />
      </div>
    </div>
  )
}

export const CredentialsPage = withIsland(CredentialsPageContent)
