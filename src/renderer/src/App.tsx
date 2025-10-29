import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/plans" element={<div>Plans Page</div>} />
          <Route path="/checkin" element={<div>Check-in Page</div>} />
          <Route path="/payments" element={<div>Payments Page</div>} />
          <Route path="/reports" element={<div>Reports Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
