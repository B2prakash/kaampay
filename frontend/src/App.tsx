import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ContractorDashboard from './pages/ContractorDashboard';
import WorkerWallet from './pages/WorkerWallet';
import InvoiceChain from './pages/InvoiceChain';
import Analytics from './pages/Analytics';
import AIAssistant from './components/AIAssistant';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F172A',
            color: '#F0EDE8',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#F59E0B', secondary: '#060B14' }, duration: 4000 },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#060B14' }, duration: 5000 },
        }}
      />
      <Routes>
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route path="/contractor" element={
          <ProtectedRoute role="contractor"><ContractorDashboard /></ProtectedRoute>
        } />
        <Route path="/worker" element={
          <ProtectedRoute role="worker"><WorkerWallet /></ProtectedRoute>
        } />
        <Route path="/invoice" element={
          <ProtectedRoute role="contractor"><InvoiceChain /></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute role="contractor"><Analytics /></ProtectedRoute>
        } />
      </Routes>
      <AIAssistant />
    </BrowserRouter>
  );
}
