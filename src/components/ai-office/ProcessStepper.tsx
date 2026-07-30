import React from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle, Terminal, Sparkles, Search, FileText, ShieldCheck, TrendingUp, Send } from 'lucide-react';

export interface ProcessStep {
  id: string;
  title: string;
  subtitle: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon?: string;
  logs: string[];
}

interface ProcessStepperProps {
  steps: ProcessStep[];
  currentStepIndex: number;
  isGenerating: boolean;
  totalTimeSeconds?: number;
}

export const ProcessStepper: React.FC<ProcessStepperProps> = ({
  steps,
  currentStepIndex,
  isGenerating,
  totalTimeSeconds = 0,
}) => {
  const getStepIcon = (step: ProcessStep) => {
    if (step.status === 'completed') {
      return <CheckCircle2 size={18} style={{ color: '#34d399' }} />;
    }
    if (step.status === 'active') {
      return <Loader2 size={18} style={{ color: '#00f2fe', animation: 'spin 1s linear infinite' }} />;
    }
    if (step.status === 'error') {
      return <AlertCircle size={18} style={{ color: '#f87171' }} />;
    }

    switch (step.id) {
      case 'scan':
        return <TrendingUp size={16} style={{ color: '#f59e0b' }} />;
      case 'analyze':
        return <Sparkles size={16} style={{ color: '#00f2fe' }} />;
      case 'research':
        return <Search size={16} style={{ color: '#38bdf8' }} />;
      case 'outline':
        return <Terminal size={16} style={{ color: '#a78bfa' }} />;
      case 'draft':
        return <FileText size={16} style={{ color: '#f472b6' }} />;
      case 'publish':
        return <Send size={16} style={{ color: '#34d399' }} />;
      default:
        return <Circle size={16} style={{ color: '#64748b' }} />;
    }
  };

  const activeStep = steps[currentStepIndex] || steps[steps.length - 1];

  return (
    <div className="ai-card" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 10px #00f2fe' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {isGenerating ? 'AI Autonomous Agent Execution' : 'Execution Pipeline'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              {isGenerating ? 'Real-time viral trend discovery, live research, drafting & direct auto-posting stream' : 'Pipeline idle'}
            </p>
          </div>
        </div>
        {totalTimeSeconds > 0 && (
          <div style={{ padding: '4px 12px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '20px', fontSize: '0.78rem', color: '#00f2fe', fontFamily: 'monospace' }}>
            Elapsed: {totalTimeSeconds}s
          </div>
        )}
      </div>

      {/* Stepper Grid */}
      <div className="ai-stepper-grid">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = step.status === 'completed';
          const isErr = step.status === 'error';

          let cardClass = 'ai-step-card';
          if (isActive) cardClass += ' active';
          else if (isDone) cardClass += ' completed';
          else if (isErr) cardClass += ' error';

          return (
            <div key={step.id} className={cardClass}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {getStepIcon(step)}
                <span className="ai-step-title">{step.title}</span>
              </div>
              <div className="ai-step-sub">{step.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* Live Terminal Log Box */}
      <div className="ai-terminal">
        <div className="ai-terminal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} style={{ color: '#00f2fe' }} />
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Agent Reasoning Log</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeStep ? activeStep.title : 'Live Feed'}
          </span>
        </div>

        <div className="ai-terminal-logs">
          {steps.flatMap(s => s.logs).length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', paddingTop: '3rem' }}>
              Awaiting trending search & auto-post execution trigger...
            </div>
          ) : (
            steps.map(s => (
              <React.Fragment key={s.id}>
                {s.logs.map((log, logIdx) => (
                  <div key={`${s.id}-${logIdx}`} className={`ai-log-line ${s.status === 'completed' ? 'completed' : ''}`}>
                    <span style={{ color: '#475569', marginRight: '6px' }}>&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
