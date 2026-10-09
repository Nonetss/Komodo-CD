import { KeyRound, Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { SoftCardList } from "@/components/shared/data-display/soft-card-list"
import { QueryErrorCard } from "@/components/shared/feedback/query-error-card"
import { StateCard } from "@/components/shared/feedback/state-card"
import { PageHero } from "@/components/shared/layout/page-hero"
import { StatStrip } from "@/components/shared/layout/stat-strip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiKeyRow } from "@/features/api-keys/components/api-key-row"
import { CreateKeyForm } from "@/features/api-keys/components/create-key-form"
import { CreatedKey } from "@/features/api-keys/components/created-key"
import { useApiKeys } from "@/features/api-keys/hooks/use-api-keys"
import { withIsland } from "@/providers/island"

const ApiKeysPageContent = () => {
  const { t } = useTranslation()
  const keysQuery = useApiKeys()
  const keys = keysQuery.data ?? []

  const [showForm, setShowForm] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  let content: React.ReactNode
  if (keysQuery.isError) {
    content = (
      <QueryErrorCard query={keysQuery} title={t("apikeys.errorLoad")} />
    )
  } else if (keysQuery.isLoading) {
    content = (
      <SoftCardList>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 px-4 py-3.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
        ))}
      </SoftCardList>
    )
  } else if (keys.length === 0) {
    content = !showForm && (
      <StateCard
        icon={KeyRound}
        title={t("apikeys.empty")}
        description={t("apikeys.emptyDescription")}
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            {t("apikeys.new")}
          </Button>
        }
      />
    )
  } else {
    content = (
      <SoftCardList as="ul">
        {keys.map((k) => (
          <ApiKeyRow key={k.id} apiKey={k} />
        ))}
      </SoftCardList>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        surface="apikeys"
        title={t("apikeys.title")}
        description={t("apikeys.description")}
        meta={
          keys.length > 0 && (
            <StatStrip
              items={[{ label: t("apikeys.count"), value: keys.length }]}
            />
          )
        }
        action={
          !showForm && (
            <Button
              icon={Plus}
              onClick={() => {
                setShowForm(true)
                setCreatedKey(null)
              }}
            >
              {t("apikeys.new")}
            </Button>
          )
        }
      />

      {createdKey && (
        <CreatedKey value={createdKey} onDismiss={() => setCreatedKey(null)} />
      )}

      {showForm && (
        <CreateKeyForm
          onCancel={() => setShowForm(false)}
          onCreated={(key) => {
            setCreatedKey(key)
            setShowForm(false)
          }}
        />
      )}

      {content}
    </div>
  )
}

export const ApiKeysPage = withIsland(ApiKeysPageContent)
