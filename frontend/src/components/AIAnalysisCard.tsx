import { Brain, Building, Zap, Clock, FileText, ChevronRight } from 'lucide-react';
import type { AIAnalysisResult } from '../types';
import { urgencyPercent } from '../utils';

interface AIAnalysisCardProps {
  result: AIAnalysisResult;
}

export function AIAnalysisCard({ result }: AIAnalysisCardProps) {
  const urgency = urgencyPercent(result.urgency_score);

  return (
    <div className="cf-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">AI Decision</h3>
          <p className="text-xs text-slate-400">
            {result.fallback_used ? 'Fallback classifier' : 'Gemini AI'} · {Math.round(result.confidence * 100)}% confidence
          </p>
        </div>
        {result.fallback_used && (
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
            Offline Mode
          </span>
        )}
      </div>

      {/* Grid of decisions */}
      <div className="p-5 grid grid-cols-2 gap-4">
        <AIDecisionField
          icon={<FileText className="w-4 h-4 text-blue-500" />}
          label="Intent"
          value={result.intent}
          className="col-span-2"
        />
        <AIDecisionField
          icon={<Building className="w-4 h-4 text-violet-500" />}
          label="Department"
          value={result.department}
        />
        <AIDecisionField
          icon={<Zap className="w-4 h-4 text-orange-500" />}
          label="Priority"
          value={result.priority}
          valueClass={
            result.priority === 'CRITICAL' ? 'text-red-600 font-bold' :
            result.priority === 'HIGH' ? 'text-orange-600 font-semibold' :
            result.priority === 'MEDIUM' ? 'text-amber-600 font-semibold' :
            'text-slate-600'
          }
        />
        <AIDecisionField
          icon={<Clock className="w-4 h-4 text-teal-500" />}
          label="SLA"
          value={`${result.sla_hours} Hours`}
        />

        {/* Urgency bar */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium">Urgency</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${urgency >= 85 ? 'bg-red-500' : urgency >= 65 ? 'bg-orange-500' : 'bg-teal-500'}`}
                style={{ width: `${urgency}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${urgency >= 85 ? 'text-red-600' : urgency >= 65 ? 'text-orange-600' : 'text-teal-600'}`}>
              {urgency}%
            </span>
          </div>
        </div>
      </div>

      {/* Required action */}
      <div className="px-5 pb-5">
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <ChevronRight className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-teal-600 font-medium">Required Action</p>
            <p className="text-sm text-teal-800 font-semibold">{result.required_action}</p>
          </div>
        </div>
      </div>

      {/* Required documents */}
      {result.required_documents.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs text-slate-500 font-medium mb-2">Required Documents</p>
          <div className="flex flex-wrap gap-2">
            {result.required_documents.map((doc) => (
              <span key={doc} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AIDecisionField({
  icon, label, value, className = '', valueClass = ''
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  valueClass?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
      <p className={`text-sm font-semibold text-slate-800 ${valueClass}`}>{value}</p>
    </div>
  );
}
