import 'leaflet/dist/leaflet.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { RouteProvider } from './features/garage-sales/context/RouteContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import PWABadge from './components/PWABadge'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Feed from './pages/Feed'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import EditListing from './pages/EditListing'
import Inbox from './pages/Inbox'
import Chat from './pages/Chat'
import SetupUsername from './pages/SetupUsername'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import GarageSales from './features/garage-sales/pages/GarageSales'             /* GARAGE-SALES-FEATURE */
import GarageSaleDetail from './features/garage-sales/pages/GarageSaleDetail'   /* GARAGE-SALES-FEATURE */
import CreateGarageSale from './features/garage-sales/pages/CreateGarageSale'   /* GARAGE-SALES-FEATURE */
import EditGarageSale from './features/garage-sales/pages/EditGarageSale'   /* GARAGE-SALES-FEATURE */

import WantedFeed from './pages/WantedFeed'
import CreateWanted from './pages/CreateWanted'
import WantedDetail from './pages/WantedDetail'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <RouteProvider>
              <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />
              <PWABadge />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/garage-sales" element={<GarageSales />} />                                                    {/* GARAGE-SALES-FEATURE */}
                <Route path="/garage-sales/:id" element={<GarageSaleDetail />} />                                            {/* GARAGE-SALES-FEATURE */}
                <Route path="/create-garage-sale" element={<ProtectedRoute><CreateGarageSale /></ProtectedRoute>} />          {/* GARAGE-SALES-FEATURE */}
                <Route path="/edit-garage-sale/:id" element={<ProtectedRoute><EditGarageSale /></ProtectedRoute>} />          {/* GARAGE-SALES-FEATURE */}
                <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/listing/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
                <Route path="/edit/:id" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
                <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                <Route path="/inbox/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/wanted" element={<ProtectedRoute><WantedFeed /></ProtectedRoute>} />
                <Route path="/create-wanted" element={<ProtectedRoute><CreateWanted /></ProtectedRoute>} />
                <Route path="/wanted/:id" element={<ProtectedRoute><WantedDetail /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/user/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
                <Route path="/setup" element={<ProtectedRoute><SetupUsername /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              </Routes>
            </RouteProvider>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}