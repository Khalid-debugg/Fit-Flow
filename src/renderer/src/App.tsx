import { HashRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout/Layout'
import { Toaster } from 'sonner'
import { lazy, Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { SettingsProvider } from './contexts/SettingsContext'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Members = lazy(() => import('./pages/Members'))
const Memberships = lazy(() => import('./pages/Memberships'))
const Plans = lazy(() => import('./pages/Plans'))
const CheckIn = lazy(() => import('./pages/CheckIn'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
function App() {
  const { i18n } = useTranslation()

  document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'

  return (
    <HashRouter>
      <SettingsProvider>
        <Layout>
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
              path="/settings"
              element={
                <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
                  <Settings />
                </Suspense>
              }
            />
          </Routes>
        </Layout>
      </SettingsProvider>
    </HashRouter>
  )
}

export default App
