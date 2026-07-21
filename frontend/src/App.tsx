import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import CompilerSimulator from './pages/CompilerSimulator';
import LedgerManager from './pages/LedgerManager';
import AISyncMonitor from './pages/AISyncMonitor';
import Marketplace from './pages/Marketplace';
import LogisticsHub from './pages/LogisticsHub';
import PaymentGateways from './pages/PaymentGateways';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/compiler" element={<CompilerSimulator />} />
    <Route path="/ledger" element={<LedgerManager />} />
    <Route path="/ai-sync" element={<AISyncMonitor />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/logistics" element={<LogisticsHub />} />
    <Route path="/payments" element={<PaymentGateways />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export { AppRoutes };