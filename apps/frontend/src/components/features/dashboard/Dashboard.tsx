import { useState } from "react"
import "@/lib/i18n"
import { useTranslation } from "react-i18next"
import { ApiKeysPanel } from "./ApiKeysPanel"
import { CredentialsPanel } from "./CredentialsPanel"
import { DeployPanel } from "./DeployPanel"
import { HistoryPanel } from "./HistoryPanel"
import { StacksPanel } from "./StacksPanel"

type Tab = "stacks" | "history" | "deploy" | "credentials" | "apikeys"

const TAB_IDS: Tab[] = ["stacks", "history", "deploy", "credentials", "apikeys"]

const getTabFromUrl = (): Tab => {
  if (typeof window === "undefined") return "stacks"
  const params = new URLSearchParams(window.location.search)
  const tab = params.get("tab") as Tab
  return TAB_IDS.includes(tab) ? tab : "stacks"
}

export const Dashboard = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>(getTabFromUrl)

  const TABS: { id: Tab; label: string }[] = [
    { id: "stacks", label: t("nav.stacks") },
    { id: "history", label: t("nav.history") },
    { id: "deploy", label: t("nav.deploy") },
    { id: "credentials", label: t("nav.credentials") },
    { id: "apikeys", label: t("nav.apikeys") },
  ]

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const url = new URL(window.location.href)
    if (newTab === "stacks") {
      url.searchParams.delete("tab")
    } else {
      url.searchParams.set("tab", newTab)
    }
    window.history.pushState({}, "", url)
  }

  return (
    <div className="space-y-6">
      <div className="border-border flex overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2.5 text-xs tracking-widest whitespace-nowrap uppercase transition-colors ${
              tab === t.id
                ? "border-primary text-primary border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stacks" && <StacksPanel />}
      {tab === "history" && <HistoryPanel />}
      {tab === "deploy" && (
        <div className="w-full max-w-md">
          <DeployPanel />
        </div>
      )}
      {tab === "credentials" && <CredentialsPanel />}
      {tab === "apikeys" && <ApiKeysPanel />}
    </div>
  )
}
