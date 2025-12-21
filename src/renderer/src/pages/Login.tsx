import { useState, FormEvent } from 'react'
import { useAuth } from '@renderer/hooks/useAuth'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Loader2, Dumbbell, LogIn, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { login } = useAuth()
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      {/* Language Toggle Button - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          onClick={toggleLanguage}
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
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </span>
          </div>
        </Button>
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
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">{t('app.tagline')}</p>
      </div>
    </div>
  )
}
