import { useState, FormEvent } from 'react'
import { useAuth } from '@renderer/hooks/useAuth'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Loader2, Dumbbell, LogIn, Languages, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { SupportedLanguage } from '@renderer/locales/i18n'

export default function Login() {
  const { login } = useAuth()
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Recovery modal state
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryLicenseKey, setRecoveryLicenseKey] = useState('')
  const [recoveryUsername, setRecoveryUsername] = useState('')
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' }
  ]

  const changeLanguage = (langCode: SupportedLanguage) => {
    i18n.changeLanguage(langCode)
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error(t('login.fillFields'))
      return
    }

    setLoading(true)
    try {
      await login(username, password)
      toast.success(t('login.success'))
    } catch (error) {
      if ((error as Error).message === 'INVALID_CREDENTIALS') {
        toast.error(t('login.invalidCredentials'))
      } else if ((error as Error).message === 'ACCOUNT_INACTIVE') {
        toast.error(t('login.accountInactive'))
      } else {
        toast.error(t('login.failed'))
      }
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecovery = async (e: FormEvent) => {
    e.preventDefault()

    if (!recoveryLicenseKey || !recoveryUsername || !recoveryPassword) {
      toast.error(t('login.recovery.fillAllFields'))
      return
    }

    setRecoveryLoading(true)
    try {
      // Validate license key first
      const licenseResult = await window.api.license.activate(recoveryLicenseKey)

      if (!licenseResult.success) {
        toast.error(t('login.recovery.invalidLicense'))
        setRecoveryLoading(false)
        return
      }

      // Get all users and find the first admin (oldest admin account)
      const usersResult = await window.electron.ipcRenderer.invoke('accounts:get', 1, {})
      const firstAdmin = usersResult.users
        .filter((user) => user.isAdmin)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]

      if (!firstAdmin) {
        toast.error(t('login.recovery.noAdminFound'))
        setRecoveryLoading(false)
        return
      }

      // Update the first admin account with new credentials
      await window.electron.ipcRenderer.invoke('accounts:update', firstAdmin.id, {
        username: recoveryUsername,
        password: recoveryPassword
      })

      toast.success(t('login.recovery.success'))
      setRecoveryOpen(false)
      setRecoveryLicenseKey('')
      setRecoveryUsername('')
      setRecoveryPassword('')
    } catch (error) {
      console.error('Recovery failed:', error)
      toast.error(t('login.recovery.failed'))
    } finally {
      setRecoveryLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              className="group relative overflow-hidden
                bg-gradient-to-br from-gray-700 to-gray-800
                hover:from-yellow-600 hover:to-orange-600
                border border-gray-600/50
                hover:border-yellow-500/50
                shadow-md hover:shadow-lg hover:shadow-yellow-500/10
                rounded-lg px-4 py-2.5
                transition-all duration-300 ease-in-out
                hover:scale-105 active:scale-95
              "
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                <span className="text-lg transition-transform duration-300 group-hover:rotate-12">
                  <Languages />
                </span>
                <span className="font-medium text-sm text-white">
                  {languages.find((l) => l.code === i18n.language)?.label || 'English'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-gray-800 border-gray-700 text-white min-w-[160px]"
          >
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`cursor-pointer hover:bg-gray-700 focus:bg-gray-700 ${
                  i18n.language === lang.code ? 'bg-yellow-600/20 text-yellow-400' : ''
                }`}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl blur-2xl opacity-30 animate-pulse" />
              <div className="relative rounded-2xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-6 shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400/20">
                <Dumbbell className="w-16 h-16 text-white drop-shadow-lg" />
              </div>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              {t('app.name')}
            </h1>
            <p className="text-gray-400 mt-2 text-center">{t('login.welcomeBack')}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-200">
                {t('login.username')}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.usernamePlaceholder')}
                disabled={loading}
                className="bg-gray-700/50 border-gray-600 focus:border-yellow-500 text-white placeholder:text-gray-500"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                {t('login.password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                disabled={loading}
                className="bg-gray-700/50 border-gray-600 focus:border-yellow-500 text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold py-6 rounded-lg shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('login.loggingIn')}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  {t('login.login')}
                </>
              )}
            </Button>
          </form>

          {/* Default Credentials Info */}
          <div className="mt-6 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
            <p className="text-xs text-gray-400 text-center">
              {t('login.defaultCredentials')}
              <br />
              <span className="text-yellow-400 font-mono">admin / admin123</span>
            </p>
          </div>

          {/* Recovery Access Button */}
          <div className="mt-4">
            <Dialog open={recoveryOpen} onOpenChange={setRecoveryOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {t('login.recovery.button')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {t('login.recovery.title')}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {t('login.recovery.description')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRecovery} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-license" className="text-gray-200">
                      {t('login.recovery.licenseKey')}
                    </Label>
                    <Input
                      id="recovery-license"
                      type="text"
                      value={recoveryLicenseKey}
                      onChange={(e) => setRecoveryLicenseKey(e.target.value)}
                      placeholder={t('login.recovery.licenseKeyPlaceholder')}
                      disabled={recoveryLoading}
                      className="bg-gray-700/50 border-gray-600 focus:border-yellow-500 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-username" className="text-gray-200">
                      {t('login.recovery.newUsername')}
                    </Label>
                    <Input
                      id="recovery-username"
                      type="text"
                      value={recoveryUsername}
                      onChange={(e) => setRecoveryUsername(e.target.value)}
                      placeholder={t('login.recovery.newUsernamePlaceholder')}
                      disabled={recoveryLoading}
                      className="bg-gray-700/50 border-gray-600 focus:border-yellow-500 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-password" className="text-gray-200">
                      {t('login.recovery.newPassword')}
                    </Label>
                    <Input
                      id="recovery-password"
                      type="password"
                      value={recoveryPassword}
                      onChange={(e) => setRecoveryPassword(e.target.value)}
                      placeholder={t('login.recovery.newPasswordPlaceholder')}
                      disabled={recoveryLoading}
                      className="bg-gray-700/50 border-gray-600 focus:border-yellow-500 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('login.recovery.processing')}
                      </>
                    ) : (
                      t('login.recovery.submit')
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">{t('app.tagline')}</p>
      </div>
    </div>
  )
}
