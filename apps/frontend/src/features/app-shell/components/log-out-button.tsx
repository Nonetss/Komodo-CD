import { navigate } from "astro:transitions/client"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

/** Cierra la sesión y vuelve al login. Va dentro de `ShellControls`. */
export const LogOutButton = () => {
  const { t } = useTranslation()

  const handleLogout = async () => {
    await authClient.signOut()
    navigate("/login")
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleLogout}
      aria-label={t("nav.logout")}
      title={t("nav.logout")}
    >
      <LogOut />
    </Button>
  )
}
