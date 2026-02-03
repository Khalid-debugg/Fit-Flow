import { HashRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout/Layout'
import { Toaster, toast } from 'sonner'
import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import { LicenseActivation } from './components/license/LicenseActivation'
import { useLicense } from './hooks/useLicense'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import { ErrorBoundary } from './components/ErrorBoundary'
import { NotificationResultsDialog } from './components/settings/NotificationResultsDialog'

interface WhatsAppNotificationResult {
  memberName: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  daysLeft: number
}

interface WhatsAppDialogData {
  results: WhatsAppNotificationResult[]
  sentCount: number
  failedCount: number
  skippedCount: number
}

interface Notification {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  translationKey?: string
  translationParams?: Record<string, string | number>
  whatsappResults?: WhatsAppDialogData
}

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Members = lazy(() => import('./pages/Members'))
const Memberships = lazy(() => import('./pages/Memberships'))
const Plans = lazy(() => import('./pages/Plans'))
const CheckIn = lazy(() => import('./pages/Checkin'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const Accounts = lazy(() => import('./pages/Accounts'))
function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <LoaderCircle className="h-20 w-20 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/members"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Members />
            </Suspense>
          }
        />
        <Route
          path="/plans"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Plans />
            </Suspense>
          }
        />
        <Route
          path="/memberships"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Memberships />
            </Suspense>
          }
        />
        <Route
          path="/checkin"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <CheckIn />
            </Suspense>
          }
        />
        <Route
          path="/reports"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Reports />
            </Suspense>
          }
        />
        <Route
          path="/accounts"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Accounts />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <ErrorBoundary>
              <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
                <Settings />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Routes>
    </Layout>
  )
}

function App() {
  const { i18n, t } = useTranslation(['settings', 'common'])
  const { isLicensed, isCheckingLicense, setIsLicensed } = useLicense()
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [whatsAppDialogData, setWhatsAppDialogData] = useState<WhatsAppDialogData>({
    results: [],
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0
  })
  const notificationListenerInitialized = useRef(false)

  document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    if (notificationListenerInitialized.current) {
      return
    }
    notificationListenerInitialized.current = true
    const handleNotification = (_event: unknown, notification: Notification) => {
      const title = notification.translationKey
        ? t(notification.translationKey, notification.translationParams || {})
        : notification.title

      const description = notification.description?.startsWith('settings:') || notification.description?.startsWith('common:')
        ? t(notification.description, notification.translationParams || {})
        : notification.description

      if (notification.whatsappResults) {
        setWhatsAppDialogData(notification.whatsappResults)

        toast.success(title, {
          description,
          action: {
            label: t('settings:whatsapp.toasts.showDetails'),
            onClick: () => setShowWhatsAppDialog(true)
          }
        })
        return
      }

      switch (notification.type) {
        case 'success':
          toast.success(title, { description })
          break
        case 'error':
          toast.error(title, { description })
          break
        case 'warning':
          toast.warning(title, { description })
          break
        case 'info':
          toast.info(title, { description })
          break
      }
    }

    window.electron.ipcRenderer.on('show-notification', handleNotification)

    return () => {
      window.electron.ipcRenderer.removeListener('show-notification', handleNotification)
    }
  }, [t])

  const handleActivated = (): void => {
    setIsLicensed(true)
  }

  if (isCheckingLicense) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoaderCircle className="h-20 w-20 animate-spin text-gray-700" />
      </div>
    )
  }

  if (!isLicensed) {
    return (
      <div className="h-screen bg-gray-50">
        <Toaster />
        <LicenseActivation open={true} onActivated={handleActivated} />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <SettingsProvider>
          <AuthProvider>
            <Toaster
              toastOptions={{
                classNames: {
                  toast: 'text-white!',
                  success: 'bg-green-600!',
                  error: 'bg-red-600!',
                  warning: 'bg-yellow-800! text-black!',
                  info: 'bg-blue-600!'
                }
              }}
            />
            <AppContent />
            {/* Global WhatsApp notification results dialog */}
            <NotificationResultsDialog
              open={showWhatsAppDialog}
              onOpenChange={setShowWhatsAppDialog}
              results={whatsAppDialogData.results}
              sentCount={whatsAppDialogData.sentCount}
              failedCount={whatsAppDialogData.failedCount}
              skippedCount={whatsAppDialogData.skippedCount}
            />
          </AuthProvider>
        </SettingsProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
