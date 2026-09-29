import { navigate } from "astro:transitions/client"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { withIsland } from "@/providers/island"

const LogOutButtonContent = () => {
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

export const LogOutButton = withIsland(LogOutButtonContent)
