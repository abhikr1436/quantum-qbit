import React from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle, Terminal, Sparkles, Search, FileText, ShieldCheck } from 'lucide-react';

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
  const getStepIcon = (step: ProcessStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (step.status === 'active') {
      return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
    }
    if (step.status === 'error') {
      return <AlertCircle className="w-5 h-5 text-rose-400" />;
    }

    switch (step.id) {
      case 'analyze':
        return <Sparkles className="w-4 h-4 text-slate-400" />;
      case 'research':
        return <Search className="w-4 h-4 text-slate-400" />;
      case 'outline':
        return <Terminal className="w-4 h-4 text-slate-400" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-slate-400" />;
      case 'audit':
        return <ShieldCheck className="w-4 h-4 text-slate-400" />;
      default:
        return <Circle className="w-4 h-4 text-slate-500" />;
    }
  };

  const activeStep = steps[currentStepIndex] || steps[steps.length - 1];

  return (
    <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute inset-0" />
            <div className="w-3 h-3 rounded-full bg-cyan-500 relative" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {isGenerating ? 'AI Autonomous Agent Execution' : 'Execution Pipeline'}
            </h3>
            <p className="text-xs text-slate-400">
              {isGenerating ? 'Real-time research, reasoning, and drafting stream' : 'Pipeline idle'}
            </p>
          </div>
        </div>
        {totalTimeSeconds > 0 && (
          <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-mono text-cyan-300">
            Elapsed: {totalTimeSeconds}s
          </div>
        )}
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = step.status === 'completed';

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : isDone
                  ? 'bg-slate-800/40 border-emerald-500/30'
                  : 'bg-slate-950/30 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-shrink-0">{getStepIcon(step, idx)}</div>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {step.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {step.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Terminal Log Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between text-slate-400 mb-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Agent Reasoning Log</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            {activeStep ? activeStep.title : 'Live Feed'}
          </span>
        </div>

        <div className="h-40 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-2">
          {steps.flatMap(s => s.logs).length === 0 ? (
            <div className="text-slate-500 italic text-center py-10">
              Awaiting prompt execution request...
            </div>
          ) : (
            steps.map(s => (
              <React.Fragment key={s.id}>
                {s.logs.map((log, logIdx) => (
                  <div key={`${s.id}-${logIdx}`} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span
                      className={
                        s.status === 'active'
                          ? 'text-cyan-300'
                          : s.status === 'completed'
                          ? 'text-slate-300'
                          : 'text-slate-400'
                      }
                    >
                      {log}
                    </span>
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
