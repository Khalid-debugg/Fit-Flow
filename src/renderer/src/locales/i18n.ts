import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonEn from './en/common.json'
import membersEn from './en/members.json'
import plansEn from './en/plans.json'
import commonAr from './ar/common.json'
import membersAr from './ar/members.json'
import plansAr from './ar/plans.json'
import membershipsAr from './ar/memberships.json'
import membershipsEn from './en/memberships.json'
import checkInsAr from './ar/checkIns.json'
import checkInsEn from './en/checkIns.json'
import dashboardAr from './ar/dashboard.json'
import dashboardEn from './en/dashboard.json'
import reportsAr from './ar/reports.json'
import reportsEn from './en/reports.json'
i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      members: membersEn,
      plans: plansEn,
      memberships: membershipsEn,
      checkIns: checkInsEn,
      dashboard: dashboardEn,
      reports: reportsEn
    },
    ar: {
      common: commonAr,
      members: membersAr,
      plans: plansAr,
      memberships: membershipsAr,
      checkIns: checkInsAr,
      dashboard: dashboardAr,
      reports: reportsAr
    }
  },
  lng: 'ar',
  fallbackLng: 'en',
  ns: ['common', 'members', 'plans', 'memberships', 'checkIns', 'dashboard', 'reports'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }
})

export default i18n
