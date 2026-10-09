import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import {
  ACTION_I18N,
  ACTION_ICON,
  DEPLOY_ACTIONS,
} from "@/entities/deploy-action"
import type { DeployAction } from "@/lib/api-types"
import { cn } from "@/lib/utils"

/** Elección de la acción a lanzar: pull, redeploy o ambas */
export function ActionChoice({
  value,
  onChange,
}: {
  value: DeployAction
  onChange: (action: DeployAction) => void
}) {
  const { t } = useTranslation()
  return (
    <fieldset className="space-y-2">
      <Text as="legend" variant="label" tone="muted" className="mb-2">
        {t("deploy.actionLabel")}
      </Text>
      <div className="grid gap-2 sm:grid-cols-3">
        {DEPLOY_ACTIONS.map((a) => {
          const Icon = ACTION_ICON[a]
          const checked = value === a
          return (
            <label
              key={a}
              className={cn(
                "has-focus-visible:ring-ring/50 flex cursor-pointer flex-col gap-1 rounded-md border px-3 py-2.5 transition-colors has-focus-visible:ring-2",
                checked
                  ? "border-rule bg-muted"
                  : "border-input hover:bg-muted/40"
              )}
            >
              <input
                type="radio"
                name="action"
                value={a}
                checked={checked}
                onChange={() => onChange(a)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex items-center gap-2 font-medium",
                  !checked && "text-muted-foreground"
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {t(`deploy.actions.${ACTION_I18N[a]}.label`)}
              </span>
              <Text variant="meta" tone="muted" className="text-pretty">
                {t(`deploy.actions.${ACTION_I18N[a]}.description`)}
              </Text>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
