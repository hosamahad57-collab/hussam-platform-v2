import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import {
  Building2,
  Wallet,
  FileText,
  ArrowRightLeft,
  Brain,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';

const client = createClient();

interface DashboardStats {
  total_tenants: number;
  active_tenants: number;
  total_accounts: number;
  total_ledger_entries: number;
  total_transactions: number;
  total_ai_requests: number;
  success_rate: number;
  recent_activity: Array<{
    id: number;
    tenant_id: number;
    request_id: string;
    model: string;
    status: string;
    tokens_used: number;
    latency_ms: number;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/dashboard/stats',
        method: 'GET',
        data: {},
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Tenants', value: stats.total_tenants, icon: Building2, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Active Tenants', value: stats.active_tenants, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Accounts', value: stats.total_accounts, icon: Wallet, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Ledger Entries', value: stats.total_ledger_entries, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Transactions', value: stats.total_transactions, icon: ArrowRightLeft, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'AI Requests', value: stats.total_ai_requests, icon: Brain, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'Success Rate', value: `${stats.success_rate}%`, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'System Status', value: 'Online', icon: Activity, color: 'text-green-400', bg: 'bg-green-400/10' },
  ] : [];

  return (
    <AppLayout title="Executive Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-3" />
                <div className="h-8 bg-muted rounded w-16" />
              </Card>
            ))
          ) : (
            statCards.map((stat, i) => (
              <Card key={i} className="glass-card-hover p-5 group cursor-default">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1.5">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Recent Activity */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Recent AI Activity</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.recent_activity.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.request_id}</p>
                    <p className="text-xs text-muted-foreground">Tenant #{item.tenant_id}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-muted-foreground">{item.model}</p>
                    <p className="text-xs text-muted-foreground">{item.tokens_used} tokens</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-muted-foreground">{item.latency_ms}ms</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}