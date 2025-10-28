import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<div>Members Page</div>} />
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
