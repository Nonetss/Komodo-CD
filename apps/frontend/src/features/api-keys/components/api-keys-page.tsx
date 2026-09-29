import { KeyRound, Loader2, Plus, ServerCrash } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { SoftCardList } from "@/components/shared/data-display/soft-card-list"
import { StateCard } from "@/components/shared/feedback/state-card"
import { FormField } from "@/components/shared/form/field-label"
import { HeroCount, PageHero } from "@/components/shared/layout/page-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiKeyRow } from "@/features/api-keys/components/api-key-row"
import { CreatedKey } from "@/features/api-keys/components/created-key"
import {
  useApiKeyCreate,
  useApiKeys,
} from "@/features/api-keys/hooks/use-api-keys"
import { getErrorMessage } from "@/lib/orpc"
import { notifyError } from "@/lib/toast"
import { withIsland } from "@/providers/island"

const ApiKeysPageContent = () => {
  const { t } = useTranslation()
  const keysQuery = useApiKeys()
  const createKey = useApiKeyCreate()
  const keys = keysQuery.data ?? []

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showForm) inputRef.current?.focus()
  }, [showForm])

  const create = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const res = await createKey.mutateAsync({ name: trimmed })
      setCreatedKey(res.key)
      setName("")
      setShowForm(false)
    } catch (err) {
      notifyError(t("apikeys.errorCreate"), getErrorMessage(err, ""))
    }
  }

  let content: React.ReactNode
  if (keysQuery.isError) {
    content = (
      <StateCard
        tone="destructive"
        icon={ServerCrash}
        title={t("apikeys.errorLoad")}
        description={getErrorMessage(keysQuery.error, "")}
        action={
          <Button variant="outline" onClick={() => keysQuery.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
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
          <Button onClick={() => setShowForm(true)}>
            <Plus />
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
          <HeroCount
            segments={[{ count: keys.length, label: t("apikeys.count") }]}
          />
        }
        action={
          !showForm && (
            <Button
              onClick={() => {
                setShowForm(true)
                setCreatedKey(null)
              }}
            >
              <Plus />
              {t("apikeys.new")}
            </Button>
          )
        }
      />

      {createdKey && (
        <CreatedKey value={createdKey} onDismiss={() => setCreatedKey(null)} />
      )}

      {showForm && (
        <form
          onSubmit={create}
          className="bg-surface flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end sm:p-5"
        >
          <FormField
            label={t("apikeys.nameLabel")}
            htmlFor="apikey-name"
            className="flex-1"
          >
            <Input
              id="apikey-name"
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("apikeys.namePlaceholder")}
              onKeyDown={(e) => e.key === "Escape" && setShowForm(false)}
            />
          </FormField>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1 sm:flex-none"
            >
              {t("apikeys.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createKey.isPending}
              className="flex-1 sm:flex-none"
            >
              {createKey.isPending && <Loader2 className="animate-spin" />}
              {createKey.isPending
                ? t("apikeys.creating")
                : t("apikeys.create")}
            </Button>
          </div>
        </form>
      )}

      {content}
    </div>
  )
}

export const ApiKeysPage = withIsland(ApiKeysPageContent)
