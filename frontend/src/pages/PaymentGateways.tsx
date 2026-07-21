import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Shield,
  Banknote,
  Smartphone,
  Wallet,
  Truck as TruckIcon,
  Zap,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const client = createClient();

interface PaymentRecord {
  id: number;
  gateway: string;
  reference_number: string;
  amount: number;
  currency: string;
  sender_name: string;
  status: string;
  verified_at: string;
}

const GATEWAYS = [
  { name: "Al-Kuraimi (MFloos)", icon: Smartphone, color: "text-green-400", description: "Mobile money transfer via MFloos app", prefix: "KRM-" },
  { name: "Al-Najm Transfer", icon: Banknote, color: "text-yellow-400", description: "Bank-to-bank wire transfer network", prefix: "NJM-" },
  { name: "Pocket (e-Wallet)", icon: Wallet, color: "text-violet-400", description: "Digital wallet payments & top-ups", prefix: "PKT-" },
  { name: "Cash on Delivery", icon: TruckIcon, color: "text-orange-400", description: "Pay upon delivery confirmation", prefix: "COD-" },
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  approved: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Approved & Deposited' },
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending Verification' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Rejected' },
};

export default function PaymentGateways() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [gatewayStats, setGatewayStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifyRef, setVerifyRef] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [gatewayFilter, setGatewayFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch payments from entity
      const paymentsRes = await client.entities.payment_verifications.query({
        query: {},
        sort: '-created_at',
        limit: 50,
      });
      setPayments(paymentsRes.data.items || []);

      // Fetch gateway stats
      const statsRes = await client.apiCall.invoke({
        url: '/api/v1/payments-gateway/stats',
        method: 'GET',
        data: {},
      });
      setGatewayStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyRef.trim()) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/payments-gateway/verify',
        method: 'POST',
        data: { reference_number: verifyRef.trim() },
      });

      const data = response.data;
      if (data.found && data.status === 'approved') {
        setVerifyResult({
          status: 'success',
          message: `✓ Transaction verified! ${data.sender_name} — ﷼ ${data.amount?.toLocaleString()} via ${data.gateway}. Status: Approved & Deposited.`,
          method: data.verification_method,
          confidence: data.confidence,
        });
      } else if (data.found && data.status === 'pending') {
        setVerifyResult({
          status: 'warning',
          message: `⏳ Transaction found but pending verification. ${data.sender_name} — ﷼ ${data.amount?.toLocaleString()} via ${data.gateway}.`,
          method: data.verification_method,
        });
      } else if (data.found && data.status === 'rejected') {
        setVerifyResult({
          status: 'error',
          message: `✗ Transaction rejected. ${data.sender_name} — ﷼ ${data.amount?.toLocaleString()} via ${data.gateway}. Please contact support.`,
          method: data.verification_method,
        });
      } else {
        setVerifyResult({
          status: 'error',
          message: data.message || `✗ Reference "${verifyRef}" not found in any gateway ledger.`,
          method: 'none',
        });
      }
    } catch (err) {
      setVerifyResult({
        status: 'error',
        message: 'Verification service unavailable. Please try again.',
        method: 'error',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async (paymentId: number) => {
    try {
      await client.apiCall.invoke({
        url: '/api/v1/payments-gateway/approve',
        method: 'POST',
        data: { payment_id: paymentId },
      });
      toast.success('Payment approved successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to approve payment');
    }
  };

  const filteredPayments = gatewayFilter === 'all'
    ? payments
    : payments.filter(p => p.gateway === gatewayFilter);

  const totalApproved = payments.filter(p => p.status === 'approved').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  if (loading) {
    return (
      <AppLayout title="Payment Gateways & Escrow Ledger">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Payment Gateways & Escrow Ledger">
      <div className="space-y-6">
        {/* Gateway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {GATEWAYS.map(gw => {
            const gwStats = gatewayStats?.gateways?.[gw.name] || { total: 0, approved: 0, volume: 0 };
            return (
              <div
                key={gw.name}
                onClick={() => setGatewayFilter(gw.name === gatewayFilter ? 'all' : gw.name)}
                className={cn(
                  "glass-card rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30",
                  gatewayFilter === gw.name && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <gw.icon className={cn("w-5 h-5", gw.color)} />
                  <h4 className="text-sm font-semibold truncate">{gw.name}</h4>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{gw.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{gwStats.total} txns</span>
                  <span className="text-xs font-bold text-primary">﷼ {(gwStats.volume / 1000).toFixed(0)}K</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-card overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
                    style={{ width: `${(gwStats.approved / Math.max(gwStats.total, 1)) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Engine */}
        <div className="glass-card rounded-xl p-5 glow-cyan">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">AI Transaction Verification Engine</h3>
            <Badge className="bg-primary/10 text-primary border border-primary/30 text-[10px]">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Enter a transaction reference number to verify against the multi-tenant escrow ledger.
            Supports Al-Kuraimi (KRM-), Al-Najm (NJM-), Pocket (PKT-), and COD references.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter reference (e.g., KRM-2026-445521)"
                value={verifyRef}
                onChange={(e) => setVerifyRef(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="pl-10 bg-card/50 border-border/50 font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={verifying || !verifyRef.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {verifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify'
              )}
            </Button>
          </div>

          {verifyResult && (
            <div className={cn(
              "mt-4 p-3 rounded-lg border text-sm",
              verifyResult.status === 'success' && "bg-green-500/10 border-green-500/30 text-green-300",
              verifyResult.status === 'warning' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
              verifyResult.status === 'error' && "bg-red-500/10 border-red-500/30 text-red-300",
            )}>
              <p>{verifyResult.message}</p>
              {verifyResult.method && verifyResult.method !== 'none' && (
                <p className="text-[10px] mt-1 opacity-70">
                  Method: {verifyResult.method === 'ai_pattern_match' ? 'AI Pattern Matching' : 'Ledger Direct Match'}
                  {verifyResult.confidence && ` • Confidence: ${(verifyResult.confidence * 100).toFixed(0)}%`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Approved</p>
            <p className="text-xl font-bold text-green-400">﷼ {totalApproved.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending Escrow</p>
            <p className="text-xl font-bold text-yellow-400">﷼ {totalPending.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Approval Rate</p>
            <p className="text-xl font-bold text-primary">
              {payments.length > 0 ? ((payments.filter(p => p.status === 'approved').length / payments.length) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        {/* Payment Ledger Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Escrow Sub-Ledger</h3>
            </div>
            {gatewayFilter !== 'all' && (
              <button
                onClick={() => setGatewayFilter('all')}
                className="text-xs text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Gateway</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Reference</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Sender</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => {
                  const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={payment.id} className="border-b border-border/10 hover:bg-card/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium">{payment.gateway}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-primary">{payment.reference_number}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{payment.sender_name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold">﷼ {(payment.amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] gap-1", statusCfg.bg, statusCfg.color, statusCfg.border, "border")}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {payment.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(payment.id)}
                            className="bg-green-500/10 text-green-300 border border-green-500/30 hover:bg-green-500/20 text-[10px] h-6 px-2"
                          >
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}