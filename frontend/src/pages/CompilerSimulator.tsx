import { useState, useRef, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Code2, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

const client = createClient();

const SAMPLE_SNIPPETS = [
  {
    label: "Entity Definition",
    code: `module SovereignLedger {
  @tenant_isolated
  @encrypted_at_rest
  entity Transaction {
    id: UUID
    amount: Decimal
    currency: Currency
    status: TransactionStatus
    created_at: Timestamp
  }

  @rate_limited(1000/min)
  function processPayment(tx: Transaction): Result<Receipt> {
    validate(tx.amount > 0)
    contract.enforce(TenantIsolation)
    return ledger.commit(tx)
  }
}`
  },
  {
    label: "Service Handler",
    code: `module PaymentGateway {
  @sovereign_mode
  function verifyKuraimiTransfer(ref: String, amount: Decimal): Result<Verification> {
    validate(ref.startsWith("KRM-"))
    contract.enforce(EscrowPolicy)
    return gateway.verify(ref, amount)
  }

  function processEscrowRelease(orderId: UUID): Result<Release> {
    validate(escrow.exists(orderId))
    contract.enforce(TenantIsolation)
    return escrow.release(orderId)
  }
}`
  },
  {
    label: "Logistics Model",
    code: `module LogisticsEngine {
  @tenant_isolated
  entity Shipment {
    id: UUID
    origin: Governorate
    destination: Governorate
    carrier: CarrierType
    weight_kg: Decimal
    status: ShipmentStatus
  }

  @rate_limited(500/min)
  function calculateRoute(origin: Governorate, dest: Governorate): Result<Route> {
    validate(origin != dest)
    return routing.optimize(origin, dest)
  }
}`
  },
];

interface StageResult {
  name: string;
  status: string;
  duration_ms: number;
  logs: Array<{ timestamp: string; level: string; message: string }>;
}

interface CompileResult {
  stages_completed: StageResult[];
  total_duration_ms: number;
  final_status: string;
  compiled_output: string;
  generated_code?: { laravel: string; flutter: string };
}

export default function CompilerSimulator() {
  const [code, setCode] = useState(SAMPLE_SNIPPETS[0].code);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(-1);
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());
  const [codeTarget, setCodeTarget] = useState<'laravel' | 'flutter'>('laravel');
  const logRef = useRef<HTMLDivElement>(null);

  const handleCompile = async () => {
    if (!code.trim()) return;
    setCompiling(true);
    setResult(null);
    setActiveStage(-1);
    setExpandedStages(new Set());

    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/compiler/simulate',
        method: 'POST',
        data: { code },
      });
      const data = response.data as CompileResult;

      // Animate stages one by one
      for (let i = 0; i < data.stages_completed.length; i++) {
        setActiveStage(i);
        setExpandedStages((prev) => new Set([...prev, i]));
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setResult(data);
      setActiveStage(data.stages_completed.length);
    } catch (err) {
      console.error('Compilation failed:', err);
    } finally {
      setCompiling(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setActiveStage(-1);
    setExpandedStages(new Set());
  };

  const toggleStage = (index: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activeStage, expandedStages]);

  return (
    <AppLayout title="Sovereign Compiler v6 Engine">
      <div className="space-y-6">
        {/* Snippet Selector */}
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              onClick={() => { setCode(snippet.code); handleReset(); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                code === snippet.code
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card/30 text-muted-foreground border-border/30 hover:border-border/60"
              )}
            >
              <Code2 className="w-3 h-3 inline mr-1.5" />
              {snippet.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="flex flex-col gap-4">
            <Card className="glass-card p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">HUS DSL Input</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReset}
                    disabled={compiling}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCompile}
                    disabled={compiling || !code.trim()}
                    className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Play className="w-3 h-3 mr-1.5" />
                    {compiling ? 'Compiling...' : 'Compile'}
                  </Button>
                </div>
              </div>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter HUS specification code..."
                className="flex-1 min-h-[280px] font-mono text-sm bg-background/50 border-border/50 resize-none scrollbar-thin"
              />
            </Card>

            {/* Pipeline Visualization */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Pipeline Stages</h3>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {['Boot', 'Parser', 'Validator', 'Resolver', 'Contract Injector', 'Generator'].map((stage, i) => {
                  const stageResult = result?.stages_completed[i];
                  const isActive = activeStage === i;
                  const isComplete = activeStage > i;
                  return (
                    <div key={stage} className="flex items-center">
                      <div className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 border",
                        isActive && "bg-primary/20 border-primary/40 text-primary glow-cyan",
                        isComplete && stageResult?.status === 'success' && "bg-green-500/10 border-green-500/30 text-green-400",
                        isComplete && stageResult?.status === 'warning' && "bg-amber-500/10 border-amber-500/30 text-amber-400",
                        !isActive && !isComplete && "bg-muted/30 border-border/50 text-muted-foreground"
                      )}>
                        {stage}
                      </div>
                      {i < 5 && (
                        <div className={cn(
                          "w-4 h-0.5 mx-0.5 transition-colors duration-300",
                          isComplete ? "bg-green-500/50" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
              {result && (
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">Total: <span className="text-foreground font-mono">{result.total_duration_ms}ms</span></span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-medium",
                    result.final_status === 'success' && "bg-green-500/10 text-green-400",
                    result.final_status === 'partial' && "bg-amber-500/10 text-amber-400",
                    result.final_status === 'failed' && "bg-red-500/10 text-red-400",
                  )}>
                    {result.final_status.toUpperCase()}
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* Output Panel */}
          <div className="flex flex-col gap-4">
            <Card className="glass-card p-5 flex flex-col">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Compile Logs</h3>
              <div ref={logRef} className="flex-1 min-h-[200px] max-h-[350px] overflow-y-auto space-y-2 scrollbar-thin">
                {!result && activeStage === -1 && (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm min-h-[200px]">
                    <p>Enter code and click Compile to begin...</p>
                  </div>
                )}
                {result?.stages_completed.map((stage, i) => (
                  <div key={i} className="border border-border/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleStage(i)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                    >
                      {getStatusIcon(stage.status)}
                      <span className="text-sm font-medium flex-1 text-left">{stage.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{stage.duration_ms}ms</span>
                      {expandedStages.has(i) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {expandedStages.has(i) && (
                      <div className="px-3 pb-3 space-y-1 border-t border-border/30">
                        {stage.logs.map((log, j) => (
                          <div key={j} className="flex gap-2 text-xs font-mono py-0.5">
                            <span className="text-muted-foreground/60 w-16 shrink-0">{log.timestamp}</span>
                            <span className={getLogColor(log.level)}>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {result && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Compiled Output:</p>
                    <p className="text-sm font-mono text-green-400 break-all">{result.compiled_output}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Generated Code Output */}
            <Card className="glass-card p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Generated Code</h3>
                </div>
                {result?.generated_code && (
                  <div className="flex gap-1 p-0.5 rounded-lg bg-card/50 border border-border/50">
                    <button
                      onClick={() => setCodeTarget('laravel')}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                        codeTarget === 'laravel'
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Laravel
                    </button>
                    <button
                      onClick={() => setCodeTarget('flutter')}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                        codeTarget === 'flutter'
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Flutter
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[200px] max-h-[350px] overflow-y-auto scrollbar-thin rounded-lg bg-[#0a0e18] border border-border/30 p-4">
                {!result?.generated_code ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm min-h-[200px]">
                    <div className="text-center">
                      <Code2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>Generated code will appear here after compilation</p>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    <code>
                      {codeTarget === 'laravel' ? (
                        <span>
                          <Badge className="mb-3 bg-red-500/10 text-red-300 border border-red-500/30 text-[10px]">
                            Target: Laravel Controller/Service
                          </Badge>
                          {'\n\n'}
                          {result.generated_code.laravel}
                        </span>
                      ) : (
                        <span>
                          <Badge className="mb-3 bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px]">
                            Target: Flutter Widget/Service
                          </Badge>
                          {'\n\n'}
                          {result.generated_code.flutter}
                        </span>
                      )}
                    </code>
                  </pre>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}