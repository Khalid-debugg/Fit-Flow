import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import { Toaster } from 'sonner'
import Plans from './pages/Plans'
import Memberships from './pages/Memberships'
import CheckIn from './pages/CheckIn'

function App() {
  const { i18n } = useTranslation()

  document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'

  return (
    <BrowserRouter>
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/reports" element={<div>Reports Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
