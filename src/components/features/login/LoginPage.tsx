import { useState } from "react"
import "@/lib/i18n"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginPage = () => {
  const { t } = useTranslation()
  const [loginError, setLoginError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  })

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
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.svg" alt="Komodo CD" className="h-16 w-auto" />
          <span className="text-lg font-semibold tracking-tight">
            Komodo CD
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {t("login.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
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
                        />
                      </FormControl>
                      <FormMessage />
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <p className="text-destructive text-sm">{loginError}</p>
                )}

                <Button type="submit" className="w-full">
                  {t("login.submit")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
