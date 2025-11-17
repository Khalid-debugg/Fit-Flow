import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'

export default function WelcomeHeader() {
  const { t } = useTranslation('dashboard')

  return (
    <div className="bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('welcome')}</h1>
          <p className="text-sm text-gray-400">{t('subtitle')}</p>
        </div>
      </div>
    </div>
  )
}
