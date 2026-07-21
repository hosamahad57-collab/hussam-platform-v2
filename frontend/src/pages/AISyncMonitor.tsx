import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Brain, Clock, Zap, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const client = createClient();

interface AILog {
  id: number;
  tenant_id: number;
  request_id: string;
  model: string;
  prompt: string;
  response: string;
  tokens_used: number;
  latency_ms: number;
  status: string;
  created_at?: string;
}

interface Tenant {
  id: number;
  name: string;
}

export default function AISyncMonitor() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);

  useEffect(() => {
    loadTenants();
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs(selectedTenant);
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      const response = await client.entities.tenants.query({ query: {}, limit: 50 });
      setTenants(response.data.items || []);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const loadLogs = async (tenantId?: string) => {
    setLoading(true);
    try {
      const query: any = {};
      if (tenantId) query.tenant_id = Number(tenantId);
      const response = await client.entities.ai_logs.query({
        query,
        sort: '-id',
        limit: 50,
      });
      setLogs(response.data.items || []);
    } catch (err) {
      console.error('Failed to load AI logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalTokens = logs.reduce((sum, l) => sum + l.tokens_used, 0);
  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.latency_ms, 0) / logs.length) : 0;
  const successCount = logs.filter((l) => l.status === 'success').length;
  const errorCount = logs.filter((l) => l.status === 'error').length;

  const getTenantName = (tenantId: number) => {
    return tenants.find((t) => t.id === tenantId)?.name || `Tenant #${tenantId}`;
  };

  return (
    <AppLayout title="AI Sync Monitors">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Filter by Tenant</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="All tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadLogs(selectedTenant)}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="text-xl font-bold font-mono">{logs.length}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-400/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
                <p className="text-xl font-bold font-mono">{totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Latency</p>
                <p className="text-xl font-bold font-mono">{avgLatency}ms</p>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-400/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Success / Error</p>
                <p className="text-xl font-bold">
                  <span className="text-green-400">{successCount}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-red-400">{errorCount}</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Logs Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Log List */}
          <div className="xl:col-span-2">
            <Card className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="text-sm font-semibold">Transaction Log Timeline</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No AI logs found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {logs.map((log) => (
                      <button
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={cn(
                          "w-full text-left p-4 hover:bg-muted/20 transition-colors",
                          selectedLog?.id === log.id && "bg-muted/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2 shrink-0",
                            log.status === 'success' ? "bg-green-400" : "bg-red-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">{log.request_id}</span>
                              <Badge variant="outline" className="text-[10px]">{log.model}</Badge>
                            </div>
                            <p className="text-sm truncate">{log.prompt}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span>{getTenantName(log.tenant_id)}</span>
                              <span>•</span>
                              <span>{log.tokens_used} tokens</span>
                              <span>•</span>
                              <span>{log.latency_ms}ms</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Detail Panel */}
          <div>
            <Card className="glass-card p-5 sticky top-4">
              <h3 className="text-sm font-semibold mb-4">Request Detail</h3>
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Request ID</p>
                    <p className="text-sm font-mono">{selectedLog.request_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Model</p>
                    <Badge variant="outline">{selectedLog.model}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {selectedLog.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        selectedLog.status === 'success' ? "text-green-400" : "text-red-400"
                      )}>
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tokens</p>
                      <p className="text-sm font-mono">{selectedLog.tokens_used}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Latency</p>
                      <p className="text-sm font-mono">{selectedLog.latency_ms}ms</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                    <div className="p-3 rounded-lg bg-muted/30 text-sm">{selectedLog.prompt}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Response</p>
                    <div className="p-3 rounded-lg bg-muted/30 text-sm">{selectedLog.response || 'No response'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a log entry to view details</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}