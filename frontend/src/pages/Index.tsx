import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Terminal, Shield, Cpu, Database, ArrowRight, Layers } from 'lucide-react';

const client = createClient();

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (res?.data) setUser(res.data);
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  const handleEnter = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      client.auth.toLogin();
    }
  };

  const features = [
    {
      icon: Terminal,
      title: 'HUS Compiler',
      description: 'Sovereign specification compiler with 6-stage pipeline validation',
    },
    {
      icon: Database,
      title: 'Multi-Tenant Ledger',
      description: 'Isolated accounting with real-time transaction processing',
    },
    {
      icon: Cpu,
      title: 'AI Orchestration',
      description: 'Intelligent sync monitors with model-agnostic execution',
    },
    {
      icon: Shield,
      title: 'Sovereign Isolation',
      description: 'Zero-trust tenant boundaries with encrypted-at-rest policies',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Sovereign Platform v2.0</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="block">Hussam</span>
            <span className="block text-gradient-cyan">Platform</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Autonomous end-to-end orchestration engine. Multi-tenant isolation, 
            sovereign compilation, and AI-driven synchronization — deployed at scale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleEnter}
              disabled={authLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-base"
            >
              {authLoading ? 'Loading...' : user ? 'Enter Dashboard' : 'Authenticate & Enter'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass-card-hover rounded-2xl p-6 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-xs text-muted-foreground">
            Designed by Dr. Hussam Al-Shargabi • Built for Sovereignty • Powered by Atoms Cloud
          </p>
        </div>
      </div>
    </div>
  );
}