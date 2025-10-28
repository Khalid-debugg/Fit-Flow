import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { menuItems } from './constants'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <div
      className="flex h-screen bg-gray-900 text-white"
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🏋️ {t('app.name')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t('app.tagline')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location?.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{t(item.label)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-4">
          <button
            onClick={toggleLanguage}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            🌐 {i18n.language === 'en' ? 'العربية' : 'English'}
          </button>

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="font-medium">{t('user.admin')}</p>
              <p className="text-xs text-gray-400">{t('user.gymOwner')}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
