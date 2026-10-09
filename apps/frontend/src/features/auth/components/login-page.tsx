import { AlertCircle, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Text } from "@/components/shared/brand/typography"
import { LanguageSwitcherButton } from "@/components/shared/controls/language-switcher"
import { ThemeToggle } from "@/components/shared/controls/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useHydrated } from "@/hooks/use-hydrated"
import { authClient } from "@/lib/auth-client"
import { withIsland } from "@/providers/island"

type LoginFormValues = { email: string; password: string }

// Estados de la regleta decorativa del panel de marca
const STRIP = "sssnsssdssnsssssnssswsssssnsss".split("")
const STRIP_COLOR: Record<string, string> = {
  s: "bg-success/80",
  n: "bg-muted-foreground/25",
  d: "bg-danger/80",
  w: "bg-warning/80",
}

function BrandPanel() {
  const { t } = useTranslation()
  return (
    <div className="bg-sidebar bg-dot-grid relative hidden overflow-hidden border-r lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="relative flex items-center gap-2.5">
        <img src="/logo.svg" alt="" aria-hidden className="h-7 w-auto" />
        <Text variant="headline" className="font-semibold">
          Komodo CD
        </Text>
      </div>

      <div className="relative max-w-md space-y-8">
        <p className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance xl:text-5xl">
          {t("login.subtitle")}
        </p>

        <div className="bg-card overflow-hidden rounded-xl border">
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <span className="bg-danger/60 size-2 rounded-full" />
            <span className="bg-warning/60 size-2 rounded-full" />
            <span className="bg-success/60 size-2 rounded-full" />
            <Text variant="data" tone="muted" className="ml-2">
              .github/workflows/deploy.yml
            </Text>
          </div>
          <pre className="text-muted-foreground p-4 font-mono text-xs leading-relaxed">
            <span className="text-primary">curl</span> -X POST
            $KOMODO_CD_URL/api/v0/deploy \{"\n"}
            {"  "}-H{" "}
            <span className="text-foreground">
              "x-api-key: $KOMODO_API_KEY"
            </span>{" "}
            \{"\n"}
            {"  "}-d{" "}
            <span className="text-success">
              '{"{"}"stack":"web","action":"pull-redeploy"{"}"}'
            </span>
          </pre>
          <div className="flex gap-0.75 border-t px-4 py-3" aria-hidden>
            {STRIP.map((c, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-[2px] ${STRIP_COLOR[c]}`}
              />
            ))}
          </div>
        </div>
      </div>

      <Text as="p" variant="status" tone="muted" className="relative">
        pull · redeploy · pull + redeploy
      </Text>
    </div>
  )
}

const LoginPageContent = () => {
  const { t } = useTranslation()
  const [loginError, setLoginError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  })
  const submitting = form.formState.isSubmitting
  // El formulario llega en el HTML del SSR: hasta hidratar, un envío sería
  // nativo. Botón deshabilitado + method="post" para que las credenciales
  // nunca acaben en la URL.
  const hydrated = useHydrated()

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null)
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setLoginError(t("login.error"))
      return
    }
    window.location.href = "/"
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="relative flex flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:invisible">
            <img src="/logo.svg" alt="" aria-hidden className="h-6 w-auto" />
            <Text variant="headline" className="font-semibold">
              Komodo CD
            </Text>
          </div>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcherButton />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-90 space-y-7">
            <div className="space-y-1">
              <Text as="h1" variant="display">
                {t("login.title")}
              </Text>
              <Text
                as="p"
                variant="meta"
                tone="muted"
                className="text-pretty lg:hidden"
              >
                {t("login.subtitle")}
              </Text>
            </div>

            <Form {...form}>
              <form
                method="post"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.emailLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder={t("login.emailPlaceholder")}
                          autoComplete="email"
                          spellCheck={false}
                          autoFocus
                          required
                          className="h-10"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.passwordLabel")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="current-password"
                          required
                          className="h-10"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {loginError && (
                  <p
                    role="alert"
                    className="text-destructive text-meta flex items-center gap-2"
                  >
                    <AlertCircle className="size-3.5 shrink-0" />
                    {loginError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="group w-full"
                  disabled={!hydrated}
                  loading={submitting}
                >
                  {submitting ? t("login.submitting") : t("login.submit")}
                  {!submitting && (
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}

export const LoginPage = withIsland(LoginPageContent)
