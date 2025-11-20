import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { menuItems } from './constants'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { useSettings } from '@renderer/hooks/useSettings'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { settings, updateSettings } = useSettings()
  const { t, i18n } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    updateSettings({ ...settings!, language: newLang })
  }

  const isRTL = i18n.language === 'ar'

  return (
    <div className="flex h-screen bg-gray-900 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside
        className={`relative bg-gray-800 border-r border-gray-700 flex flex-col transition-[width] duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Arrow */}
        <Button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute top-6 bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors w-10 h-10 ${
            isRTL ? '-left-5' : '-right-5'
          }`}
        >
          {/* Flip arrow direction correctly */}
          {isRTL ? (
            collapsed ? (
              <ChevronLeft />
            ) : (
              <ChevronRight />
            )
          ) : collapsed ? (
            <ChevronRight />
          ) : (
            <ChevronLeft />
          )}
        </Button>

        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center gap-2">
          <span className="text-2xl">🏋️</span>
          {!collapsed && (
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {t('app.name')}
              </h1>
              <p className="text-sm text-gray-400 mt-1">{t('app.tagline')}</p>
            </div>
          )}
        </div>

        {/* Menu */}
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
                {!collapsed && <span className="font-medium">{t(item.label)}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-4">
          <Button
            onClick={toggleLanguage}
            variant="default"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            <span>🌐</span>
            {!collapsed && <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>}
          </Button>

          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'} py-3`}>
            <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            {!collapsed && (
              <div>
                <p className="font-medium">{t('user.admin')}</p>
                <p className="text-xs text-gray-400">{t('user.gymOwner')}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
