import { Trans } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { API_KEY_PLACEHOLDER } from "@/entities/deploy-action/model/deploy-actions"
import { cn } from "@/lib/utils"

/** Pista bajo un `curl` de ejemplo: qué sustituir y dónde crear la key. */
export function DeployCurlHint({ className }: { className?: string }) {
  return (
    <Text
      as="p"
      variant="meta"
      tone="muted"
      className={cn("text-pretty", className)}
    >
      <Trans
        i18nKey="stacks.ciHint"
        values={{ placeholder: API_KEY_PLACEHOLDER }}
        components={{
          code: <code className="text-signal-ink text-xs" />,
          keys: (
            // biome-ignore lint/a11y/useAnchorContent: Trans inyecta el texto
            <a
              href="/keys"
              className="text-foreground hover:text-signal-ink decoration-signal underline underline-offset-4"
            />
          ),
        }}
      />
    </Text>
  )
}
