import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ArrowUpRight, ArrowDownRight, Building2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const client = createClient();

interface Tenant {
  id: number;
  name: string;
  domain: string;
  status: string;
  plan: string;
}

interface Account {
  id: number;
  tenant_id: number;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  status: string;
}

interface LedgerEntry {
  id: number;
  tenant_id: number;
  account_id: number;
  description: string;
  amount: number;
  entry_type: string;
  reference_id: string;
  status: string;
}

export default function LedgerManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    description: '',
    amount: '',
    entry_type: 'credit',
    reference_id: '',
  });

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadAccounts(selectedTenant);
      loadEntries(selectedTenant);
    }
  }, [selectedTenant]);

  useEffect(() => {
    if (selectedTenant) {
      loadEntries(selectedTenant, selectedAccount);
    }
  }, [selectedAccount]);

  const loadTenants = async () => {
    try {
      const response = await client.entities.tenants.query({ query: {}, limit: 50 });
      setTenants(response.data.items || []);
      if (response.data.items?.length > 0) {
        setSelectedTenant(String(response.data.items[0].id));
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async (tenantId: string) => {
    try {
      const response = await client.entities.accounts.query({
        query: { tenant_id: Number(tenantId) },
        limit: 50,
      });
      setAccounts(response.data.items || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const loadEntries = async (tenantId: string, accountId?: string) => {
    try {
      const query: any = { tenant_id: Number(tenantId) };
      if (accountId) query.account_id = Number(accountId);
      const response = await client.entities.ledger_entries.query({
        query,
        sort: '-id',
        limit: 15,
      });
      setEntries(response.data.items || []);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const handleCreateEntry = async () => {
    if (!selectedTenant || !selectedAccount || !newEntry.description || !newEntry.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await client.entities.ledger_entries.create({
        data: {
          tenant_id: Number(selectedTenant),
          account_id: Number(selectedAccount),
          description: newEntry.description,
          amount: parseFloat(newEntry.amount),
          entry_type: newEntry.entry_type,
          reference_id: newEntry.reference_id || `REF-${Date.now()}`,
          status: 'posted',
        },
      });
      toast.success('Ledger entry created');
      setDialogOpen(false);
      setNewEntry({ description: '', amount: '', entry_type: 'credit', reference_id: '' });
      loadEntries(selectedTenant, selectedAccount);
    } catch (err) {
      toast.error('Failed to create entry');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const currentTenant = tenants.find((t) => String(t.id) === selectedTenant);

  return (
    <AppLayout title="Multi-Tenant Accounting Ledger">
      <div className="space-y-6">
        {/* Tenant Selector */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Select Tenant</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select a tenant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span className="flex items-center gap-2">
                      <Building2 className="w-3 h-3" />
                      {t.name}
                      <Badge variant="outline" className="text-[10px] ml-1">
                        {t.plan}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Filter by Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} ({a.account_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50">
                <DialogHeader>
                  <DialogTitle>Create Ledger Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      placeholder="Transaction description..."
                      className="mt-1.5 bg-background/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input
                        type="number"
                        value={newEntry.amount}
                        onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                        placeholder="0.00"
                        className="mt-1.5 bg-background/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={newEntry.entry_type} onValueChange={(v) => setNewEntry({ ...newEntry, entry_type: v })}>
                        <SelectTrigger className="mt-1.5 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="debit">Debit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Reference ID (optional)</Label>
                    <Input
                      value={newEntry.reference_id}
                      onChange={(e) => setNewEntry({ ...newEntry, reference_id: e.target.value })}
                      placeholder="INV-2026-XXXX"
                      className="mt-1.5 bg-background/50"
                    />
                  </div>
                  <Button onClick={handleCreateEntry} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Create Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Accounts Overview */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="glass-card-hover p-4 cursor-pointer" onClick={() => setSelectedAccount(String(account.id))}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{account.account_type}</p>
                    <p className="text-sm font-medium mt-1">{account.name}</p>
                    <p className="text-lg font-bold mt-1 font-mono">{formatCurrency(account.balance, account.currency)}</p>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    account.account_type === 'revenue' && "bg-green-500/10",
                    account.account_type === 'expense' && "bg-red-500/10",
                    account.account_type === 'asset' && "bg-blue-500/10",
                  )}>
                    <DollarSign className={cn(
                      "w-4 h-4",
                      account.account_type === 'revenue' && "text-green-400",
                      account.account_type === 'expense' && "text-red-400",
                      account.account_type === 'asset' && "text-blue-400",
                    )} />
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "mt-3 text-[10px]",
                  account.status === 'active' && "border-green-500/30 text-green-400",
                  account.status === 'frozen' && "border-amber-500/30 text-amber-400",
                )}>
                  {account.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}

        {/* Ledger Table */}
        <Card className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h3 className="text-sm font-semibold">
              Purchase Registry
              {currentTenant && <span className="text-muted-foreground font-normal ml-2">— {currentTenant.name}</span>}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Reference</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Description</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Type</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Amount</th>
                  <th className="text-center p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No ledger entries found for this selection.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{entry.reference_id}</td>
                      <td className="p-3">{entry.description}</td>
                      <td className="p-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium",
                          entry.entry_type === 'credit' ? "text-green-400" : "text-red-400"
                        )}>
                          {entry.entry_type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {entry.entry_type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-medium">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={cn(
                          "text-[10px]",
                          entry.status === 'posted' && "border-green-500/30 text-green-400",
                          entry.status === 'pending' && "border-amber-500/30 text-amber-400",
                        )}>
                          {entry.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}