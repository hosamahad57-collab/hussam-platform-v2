import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Truck,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Weight,
  Calculator,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const client = createClient();

interface Shipment {
  id: number;
  order_reference: string;
  origin_governorate: string;
  destination_governorate: string;
  carrier: string;
  status: string;
  estimated_days: number;
  tracking_code: string;
  weight_kg: number;
  shipping_cost_yer: number;
}

const GOVERNORATES = ["Sana'a", "Aden", "Taiz", "Hadramout", "Marib", "Ibb", "Socotra", "Hodeidah"];
const CARRIERS = [
  { name: "Al-Universal Express", type: "National Logistics", coverage: "All Governorates", speed: "2-5 days" },
  { name: "Yemen Express", type: "Premium Courier", coverage: "Major Cities", speed: "1-4 days" },
  { name: "Bus Freight Network", type: "Economy Freight", coverage: "Highway Routes", speed: "2-3 days" },
  { name: "Local Motorcycle Courier", type: "Last-Mile Delivery", coverage: "Urban Areas", speed: "Same Day - 2 days" },
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  processing: { icon: Loader2, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Processing' },
  in_transit: { icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'In Transit' },
  delivered: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Delivered' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Failed' },
};

export default function LogisticsHub() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Route calculator state
  const [calcOrigin, setCalcOrigin] = useState("Sana'a");
  const [calcDest, setCalcDest] = useState("Aden");
  const [calcCarrier, setCalcCarrier] = useState("Al-Universal Express");
  const [calcWeight, setCalcWeight] = useState("2.0");
  const [routeResult, setRouteResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch shipments from entity
      const shipmentsRes = await client.entities.shipments.query({
        query: {},
        sort: '-created_at',
        limit: 50,
      });
      setShipments(shipmentsRes.data.items || []);

      // Fetch stats from custom API
      const statsRes = await client.apiCall.invoke({
        url: '/api/v1/logistics/stats',
        method: 'GET',
        data: {},
      });
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch logistics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async () => {
    setCalculating(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/logistics/calculate-route',
        method: 'POST',
        data: {
          origin: calcOrigin,
          destination: calcDest,
          carrier: calcCarrier,
          weight_kg: parseFloat(calcWeight) || 1.0,
        },
      });
      setRouteResult(response.data);
    } catch (err) {
      toast.error('Route calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const createShipment = async () => {
    if (!routeResult) return;
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/logistics/create-shipment',
        method: 'POST',
        data: {
          origin_governorate: calcOrigin,
          destination_governorate: calcDest,
          carrier: calcCarrier,
          weight_kg: parseFloat(calcWeight) || 1.0,
        },
      });
      toast.success(`Shipment created! Tracking: ${response.data.tracking_code}`);
      setRouteResult(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to create shipment');
    }
  };

  const filteredShipments = statusFilter === 'all'
    ? shipments
    : shipments.filter(s => s.status === statusFilter);

  if (loading) {
    return (
      <AppLayout title="Inter-Governorate Logistics Hub">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Inter-Governorate Logistics Hub">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Shipments', value: stats?.total || shipments.length, icon: Package, color: 'text-primary' },
            { label: 'In Transit', value: stats?.in_transit || 0, icon: Truck, color: 'text-cyan-400' },
            { label: 'Delivered', value: stats?.delivered || 0, icon: CheckCircle2, color: 'text-green-400' },
            { label: 'Failed', value: stats?.failed || 0, icon: XCircle, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("w-4 h-4", stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Route Calculator */}
        <div className="glass-card rounded-xl p-5 glow-cyan">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Route Calculator & Shipment Creator</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Origin</label>
              <select
                value={calcOrigin}
                onChange={(e) => setCalcOrigin(e.target.value)}
                className="w-full rounded-md bg-card/50 border border-border/50 px-3 py-2 text-xs"
              >
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Destination</label>
              <select
                value={calcDest}
                onChange={(e) => setCalcDest(e.target.value)}
                className="w-full rounded-md bg-card/50 border border-border/50 px-3 py-2 text-xs"
              >
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Carrier</label>
              <select
                value={calcCarrier}
                onChange={(e) => setCalcCarrier(e.target.value)}
                className="w-full rounded-md bg-card/50 border border-border/50 px-3 py-2 text-xs"
              >
                {CARRIERS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Weight (kg)</label>
              <Input
                type="number"
                value={calcWeight}
                onChange={(e) => setCalcWeight(e.target.value)}
                className="bg-card/50 border-border/50 text-xs h-9"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={calculateRoute}
                disabled={calculating || calcOrigin === calcDest}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 flex-1"
              >
                {calculating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Calculate'}
              </Button>
            </div>
          </div>

          {routeResult && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-xs">
                <span><strong className="text-primary">{routeResult.distance_km} km</strong> distance</span>
                <span><strong className="text-cyan-400">{routeResult.estimated_days} days</strong> ETA</span>
                <span><strong className="text-green-400">﷼ {routeResult.shipping_cost_yer?.toLocaleString()}</strong> cost</span>
                <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[10px]">
                  {routeResult.route_type}
                </Badge>
              </div>
              <Button
                size="sm"
                onClick={createShipment}
                className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Create Shipment
              </Button>
            </div>
          )}
        </div>

        {/* Transport Network Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CARRIERS.map(carrier => (
            <div key={carrier.name} className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold truncate">{carrier.name}</h4>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{carrier.type}</p>
                <div className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3 h-3 text-violet-400" />
                  <span className="text-violet-300">{carrier.coverage}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-300">{carrier.speed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Governorate Network */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Active Routes — Governorate Network</h3>
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {GOVERNORATES.map((gov, i) => {
              const activeRoutes = shipments.filter(s => s.origin_governorate === gov || s.destination_governorate === gov);
              const isActive = activeRoutes.length > 0;
              return (
                <div
                  key={gov}
                  className={cn(
                    "relative px-4 py-3 rounded-lg border text-center transition-all",
                    isActive
                      ? "bg-primary/5 border-primary/30 text-primary"
                      : "bg-card/30 border-border/30 text-muted-foreground"
                  )}
                >
                  <MapPin className="w-3 h-3 mx-auto mb-1" />
                  <p className="text-xs font-medium">{gov}</p>
                  {isActive && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                      {activeRoutes.length}
                    </span>
                  )}
                  {i < GOVERNORATES.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-border/50 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipment Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold">Shipment Registry</h3>
            <div className="flex gap-1.5">
              {['all', 'in_transit', 'processing', 'delivered', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    statusFilter === status
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Route</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Carrier</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">ETA</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map(shipment => {
                  const statusCfg = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.processing;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className="border-b border-border/10 hover:bg-card/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono font-medium">{shipment.order_reference}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{shipment.tracking_code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span>{shipment.origin_governorate}</span>
                          <ArrowRight className="w-3 h-3 text-primary" />
                          <span>{shipment.destination_governorate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{shipment.carrier}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[10px] gap-1", statusCfg.bg, statusCfg.color, statusCfg.border, "border")}>
                          <StatusIcon className={cn("w-3 h-3", shipment.status === 'processing' && "animate-spin")} />
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{shipment.estimated_days} days</td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-primary">﷼ {shipment.shipping_cost_yer?.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipment Detail Panel */}
        {selectedShipment && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedShipment(null)} />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-50 flex flex-col">
              <div className="h-16 flex items-center justify-between px-5 border-b border-border">
                <h3 className="font-semibold text-sm">Shipment Details</h3>
                <button onClick={() => setSelectedShipment(null)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-5 space-y-4">
                <div className="glass-card rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Order Reference</span>
                    <span className="text-xs font-mono font-bold">{selectedShipment.order_reference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tracking Code</span>
                    <span className="text-xs font-mono text-primary">{selectedShipment.tracking_code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Carrier</span>
                    <span className="text-xs">{selectedShipment.carrier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Weight</span>
                    <span className="text-xs flex items-center gap-1"><Weight className="w-3 h-3" />{selectedShipment.weight_kg} kg</span>
                  </div>
                </div>

                <div className="glass-card rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-3">Route Progress</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-1">
                        <MapPin className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-[10px] font-medium">{selectedShipment.origin_governorate}</p>
                    </div>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-green-500 via-primary to-border/30 rounded-full relative">
                      {selectedShipment.status === 'in_transit' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background animate-pulse" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full border flex items-center justify-center mb-1",
                        selectedShipment.status === 'delivered'
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-card/30 border-border/30"
                      )}>
                        <MapPin className={cn("w-4 h-4", selectedShipment.status === 'delivered' ? "text-green-400" : "text-muted-foreground")} />
                      </div>
                      <p className="text-[10px] font-medium">{selectedShipment.destination_governorate}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Shipping Cost</span>
                    <span className="text-lg font-bold text-primary">﷼ {selectedShipment.shipping_cost_yer?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}