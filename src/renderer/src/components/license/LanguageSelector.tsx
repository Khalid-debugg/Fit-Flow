import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import type { SupportedLanguage } from '../../locales/i18n'

interface Language {
  code: SupportedLanguage
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
]

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = async (langCode: SupportedLanguage): Promise<void> => {
    await i18n.changeLanguage(langCode)

    // Update document direction for RTL languages
    if (langCode === 'ar') {
      document.documentElement.dir = 'rtl'
      document.documentElement.classList.add('rtl')
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.classList.remove('rtl')
    }

    setOpen(false)
  }

  return (
    <>
      <style>
        {`
          .language-menu-item {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .language-menu-item:hover {
            background: linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
            transform: translateX(4px);
          }

          .language-menu-item.rtl:hover {
            transform: translateX(-4px);
          }

          .language-flag {
            font-size: 20px;
            line-height: 1;
            display: inline-block;
          }
        `}
      </style>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            aria-label="Select language"
          >
            <span className="language-flag">{currentLanguage.flag}</span>
            <Globe className="w-4 h-4 text-white" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 bg-gray-900 border-gray-700 shadow-2xl shadow-black/50"
        >
          <div className="p-2 border-b border-gray-700 mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
              Select Language
            </p>
          </div>

          {languages.map((language) => {
            const isSelected = i18n.language === language.code
            const isRTL = language.code === 'ar'

            return (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`language-menu-item ${isRTL ? 'rtl' : ''} flex items-center justify-between px-3 py-2.5 cursor-pointer text-gray-200 hover:text-white focus:text-white ${
                  isSelected ? 'bg-orange-600/20 text-white' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="language-flag">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{language.nativeName}</span>
                    <span className="text-xs text-gray-500">{language.name}</span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-orange-400" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
