import { AlertTriangle, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { CodeBlock } from "@/components/shared/data-display/code-block"
import {
  MetadataCell,
  MetadataList,
} from "@/components/shared/data-display/metadata-cell"
import { StatusTag } from "@/components/shared/data-display/status-dot"
import { Segmented } from "@/components/shared/form/segmented"
import { Button } from "@/components/ui/button"
import {
  ACTION_I18N,
  ACTION_ICON,
  buildDeployCurl,
  DEPLOY_ACTIONS,
  DeployCurlHint,
} from "@/entities/deploy-action"
import { StackStateDot, StackStateTag } from "@/entities/stack"
import { ImageRef } from "@/features/stacks/components/image-ref"
import { hasUpdate } from "@/features/stacks/model/stack-groups"
import { useAppUrl } from "@/hooks/use-app-url"
import type { DeployAction, Stack } from "@/lib/api-types"
import { cn } from "@/lib/utils"

export function StackRow({
  stack,
  expanded,
  onToggle,
  selected,
  onSelect,
  pendingAction,
  onAction,
}: {
  stack: Stack
  expanded: boolean
  onToggle: () => void
  selected: boolean
  onSelect: () => void
  pendingAction: DeployAction | null
  onAction: (action: DeployAction) => void
}) {
  const { t } = useTranslation()
  const { info } = stack
  const update = hasUpdate(stack)
  const problem = info.project_missing || info.missing_files.length > 0
  const appUrl = useAppUrl()
  const [curlAction, setCurlAction] = useState<DeployAction>("pull-redeploy")
  const detailsId = `stack-${stack.id}`
  const hasCommit = !!(info.deployed_hash || info.latest_hash)

  return (
    <li id={`row-${stack.name}`} className="group scroll-mt-24">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors",
          expanded ? "bg-primary/6" : "hover:bg-muted/40"
        )}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={t("stacks.selectStack", { stack: stack.name })}
          className="accent-primary size-4 shrink-0 cursor-pointer"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? t("stacks.collapse") : t("stacks.expand")}
          className="focus-visible:ring-ring/50 -my-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-2"
        >
          <StackStateDot state={info.state} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <Text variant="headline" className="truncate">
                {stack.name}
              </Text>
              {problem && (
                <AlertTriangle
                  aria-hidden
                  className="text-danger size-3.5 shrink-0"
                />
              )}
            </span>
            <Text
              as="span"
              variant="meta"
              tone="muted"
              className="flex min-w-0 items-center gap-2"
            >
              <span className="shrink-0 tabular-nums">
                {t("stacks.services", { count: info.services.length })}
              </span>
              {info.repo && (
                <span className="hidden min-w-0 items-center gap-2 sm:flex">
                  <span aria-hidden className="text-border">
                    ·
                  </span>
                  <Text variant="data" className="truncate">
                    {info.repo}@{info.branch}
                  </Text>
                </span>
              )}
            </Text>
          </span>
          {update && (
            <StatusTag
              tone="primary"
              ink
              title={t("stacks.updateAvailable")}
              className="shrink-0"
            >
              <span className="hidden sm:inline">
                {t("stacks.updateAvailable")}
              </span>
            </StatusTag>
          )}
          <StackStateTag
            state={info.state}
            className="hidden w-24 shrink-0 md:inline-flex"
          />
        </button>

        <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {DEPLOY_ACTIONS.map((action) => {
            const label = t(`deploy.actions.${ACTION_I18N[action]}.label`)
            return (
              <Button
                key={action}
                type="button"
                variant="ghost"
                size="icon-sm"
                icon={ACTION_ICON[action]}
                loading={pendingAction === action}
                disabled={pendingAction !== null}
                onClick={() => onAction(action)}
                title={label}
                aria-label={`${label} ${stack.name}`}
                className="text-muted-foreground hover:text-foreground"
              />
            )
          })}
          <span
            aria-hidden
            className="bg-border mx-1 hidden h-4 w-px sm:block"
          />
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            aria-hidden
            className="text-muted-foreground hover:text-foreground hidden size-8 cursor-pointer items-center justify-center rounded-md sm:flex"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id={detailsId}
          className="bg-muted/40 dark:bg-muted/20 space-y-6 border-t px-4 pt-4 pb-5 md:pl-8.5"
        >
          {problem && (
            <p className="text-danger text-meta flex items-start gap-2">
              <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span className="wrap-break-word">
                {info.project_missing
                  ? t("stacks.projectMissing")
                  : t("stacks.missingFiles", {
                      files: info.missing_files.join(", "),
                    })}
              </span>
            </p>
          )}

          {(hasCommit || info.repo) && (
            <MetadataList
              columns={3}
              bordered={false}
              className="flex flex-wrap gap-x-10 gap-y-4 py-0"
            >
              {hasCommit && (
                <MetadataCell label={t("stacks.commitLabel")}>
                  <Text variant="data">
                    {info.deployed_hash ?? "—"}
                    {update && info.latest_hash && (
                      <span className="text-primary">
                        {" → "}
                        {info.latest_hash}
                      </span>
                    )}
                  </Text>
                </MetadataCell>
              )}
              {info.repo && (
                <MetadataCell
                  label={t("stacks.repoLabel")}
                  className="basis-60 grow"
                >
                  <Text variant="data" className="block truncate">
                    {info.repo_link ? (
                      <a
                        href={info.repo_link}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary underline-offset-4 hover:underline"
                      >
                        {info.repo}
                      </a>
                    ) : (
                      info.repo
                    )}
                    <span className="text-muted-foreground">
                      {" "}
                      · {info.branch}
                    </span>
                  </Text>
                </MetadataCell>
              )}
            </MetadataList>
          )}

          <section className="space-y-2">
            <Text
              as="h3"
              variant="label"
              tone="muted"
              className="flex items-baseline gap-2"
            >
              {t("stacks.servicesTitle")}
              <span className="font-mono tabular-nums">
                {info.services.length}
              </span>
            </Text>
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {info.services.map((svc) => (
                <li
                  key={svc.service}
                  className="flex max-w-full min-w-0 items-baseline gap-2"
                >
                  <span className="flex shrink-0 items-center gap-2 font-medium">
                    {svc.service}
                    {svc.update_available && (
                      <StatusTag
                        tone="primary"
                        ink
                        title={t("stacks.updateAvailable")}
                      >
                        {t("stacks.updateTag")}
                      </StatusTag>
                    )}
                  </span>
                  <ImageRef image={svc.image} />
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <Text as="h3" variant="label" tone="muted">
              {t("stacks.ciTitle")}
            </Text>
            <CodeBlock
              language="shell"
              code={buildDeployCurl(appUrl, stack.name, curlAction)}
              header={
                <Segmented
                  variant="tabs"
                  value={curlAction}
                  onChange={setCurlAction}
                  aria-label={t("stacks.ciTitle")}
                  options={DEPLOY_ACTIONS.map((a) => ({
                    value: a,
                    label: t(`deploy.actions.${ACTION_I18N[a]}.label`),
                  }))}
                />
              }
            />
            <DeployCurlHint />
          </section>
        </div>
      )}
    </li>
  )
}
