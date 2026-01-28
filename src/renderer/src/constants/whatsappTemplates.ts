import type { SupportedLanguage } from '../locales/i18n'

export const DEFAULT_WHATSAPP_TEMPLATES: Record<SupportedLanguage, string> = {
  ar: 'مرحباً {name}، عضويتك في {gym_name} ستنتهي في {days_left} أيام بتاريخ {end_date}. يرجى التجديد للاستمرار في استخدام النادي.',
  en: 'Hello {name}, your membership at {gym_name} will expire in {days_left} days on {end_date}. Please renew to continue using the gym.',
  es: 'Hola {name}, tu membresía en {gym_name} expirará en {days_left} días el {end_date}. Por favor renueva para continuar usando el gimnasio.',
  pt: 'Olá {name}, sua assinatura em {gym_name} expirará em {days_left} dias no dia {end_date}. Por favor, renove para continuar usando a academia.',
  fr: 'Bonjour {name}, votre adhésion à {gym_name} expirera dans {days_left} jours le {end_date}. Veuillez renouveler pour continuer à utiliser la salle de sport.',
  de: 'Hallo {name}, Ihre Mitgliedschaft bei {gym_name} läuft in {days_left} Tagen am {end_date} ab. Bitte erneuern Sie, um das Fitnessstudio weiter zu nutzen.'
}
