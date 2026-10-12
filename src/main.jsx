import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import ConcertPage from './pages/ConcertPage.jsx'
import MyTicketsPage from './pages/MyTicketsPage.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminTickets from './pages/admin/AdminTickets.jsx'
import AdminScanner from './pages/admin/AdminScanner.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminEvent from './pages/admin/AdminEvent.jsx'
import SmartLinkEditor from './pages/SmartLinkEditor.jsx'
import PolicyPage from './pages/legal/PolicyPage.jsx'
import { TERMS, PRIVACY, REFUNDS, CONTACT } from './pages/legal/legalContent.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Smartlink landing page */}
        <Route path="/" element={<App />} />

        {/* Customer ticketing */}
        <Route path="/concert" element={<ConcertPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/editor" element={<SmartLinkEditor />} />

        {/* Compliance pages (required for payment gateway verification) */}
        <Route path="/terms" element={<PolicyPage doc={TERMS} />} />
        <Route path="/privacy" element={<PolicyPage doc={PRIVACY} />} />
        <Route path="/refunds" element={<PolicyPage doc={REFUNDS} />} />
        <Route path="/contact" element={<PolicyPage doc={CONTACT} />} />

        {/* Admin panel */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="scan" element={<AdminScanner />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="event" element={<AdminEvent />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
