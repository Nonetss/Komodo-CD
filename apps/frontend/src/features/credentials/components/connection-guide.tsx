import { Trans, useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"

const STEPS = [
  "credentials.howStep1",
  "credentials.howStep2",
  "credentials.howStep3",
  "credentials.howStep4",
] as const

/**
 * Guía: de dónde sacar la key y el secret de Komodo. Pasos numerados en una
 * tarjeta; en escritorio van en fila, unidos por un trazo fino. Las rutas de
 * la interfaz de Komodo (`<ui>`) se marcan como teclas.
 */
export function ConnectionGuide() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="connection-guide" className="space-y-3">
      <Text as="h2" id="connection-guide" variant="caption">
        {t("credentials.howTitle")}
      </Text>
      <ol className="border-rule grid grid-cols-1 gap-x-6 gap-y-4 rule-t border-b py-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step} className="flex min-w-0 gap-3 lg:flex-col">
            <span className="flex items-center gap-3">
              <span className="border-signal text-signal flex size-7 shrink-0 items-center justify-center border-[1.5px] font-mono text-xs tabular-nums">
                {i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="bg-border hidden h-px flex-1 lg:block"
                />
              )}
            </span>
            <Text as="p" className="min-w-0 pt-1 text-pretty lg:pt-0">
              <Trans
                i18nKey={step}
                components={{
                  ui: (
                    <kbd className="bg-muted text-foreground rounded-sm border px-1.5 py-0.5 text-xs whitespace-nowrap" />
                  ),
                }}
              />
            </Text>
          </li>
        ))}
      </ol>
    </section>
  )
}
