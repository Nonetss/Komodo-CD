import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"

/** Guía: de dónde sacar la key y el secret de Komodo, en una franja de pasos */
export function ConnectionGuide() {
  const { t } = useTranslation()
  const steps = [
    t("credentials.howStep1"),
    t("credentials.howStep2"),
    t("credentials.howStep3"),
    t("credentials.howStep4"),
  ]
  return (
    <section aria-labelledby="connection-guide" className="space-y-3">
      <Text as="h2" id="connection-guide" variant="label" tone="muted">
        {t("credentials.howTitle")}
      </Text>
      <ol className="grid grid-cols-1 gap-x-8 gap-y-5 border-y py-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step} className="min-w-0">
            <Text as="span" variant="data" tone="primary" aria-hidden>
              {i + 1}
            </Text>
            <Text as="p" className="mt-1 leading-relaxed text-pretty">
              {step}
            </Text>
          </li>
        ))}
      </ol>
    </section>
  )
}
