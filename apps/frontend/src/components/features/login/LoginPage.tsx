import { AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { LanguageSwitcherButton } from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"
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
    <div className="bg-sidebar relative hidden overflow-hidden border-r lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        className="bg-grid absolute inset-0 opacity-40 mask-[radial-gradient(ellipse_at_30%_20%,black_20%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative flex items-center gap-2.5">
        <img src="/logo.svg" alt="" aria-hidden className="h-7 w-auto" />
        <span className="text-lg font-semibold tracking-tight">Komodo CD</span>
      </div>

      <div className="relative max-w-md space-y-8">
        <p className="text-4xl leading-[1.08] font-semibold tracking-[-0.025em] text-balance xl:text-5xl">
          {t("login.subtitle")}
        </p>

        <div className="bg-card/80 overflow-hidden rounded-xl border shadow-2xl backdrop-blur">
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <span className="bg-danger/60 size-2 rounded-full" />
            <span className="bg-warning/60 size-2 rounded-full" />
            <span className="bg-success/60 size-2 rounded-full" />
            <span className="text-muted-foreground ml-2 font-mono text-micro">
              .github/workflows/deploy.yml
            </span>
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

      <p className="section-label relative">
        pull · redeploy · pull + redeploy
      </p>
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
            <span className="font-semibold tracking-tight">Komodo CD</span>
          </div>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcherButton />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="reveal w-full max-w-90 space-y-7">
            <div className="space-y-2">
              <h1 className="text-title">{t("login.title")}</h1>
              <p className="text-muted-foreground text-sm text-pretty lg:hidden">
                {t("login.subtitle")}
              </p>
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
                    className="bg-danger/10 border-danger/25 text-danger flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                  >
                    <AlertCircle className="size-3.5 shrink-0" />
                    {loginError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="group w-full"
                  disabled={!hydrated || submitting}
                >
                  {submitting ? <Loader2 className="animate-spin" /> : null}
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
