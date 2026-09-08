import { CheckCircle, Clock, Circle, AlertCircle } from 'lucide-react';
import type { WorkflowStep } from '../types';
import { formatTime } from '../utils';

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
}

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isDone = step.status === 'COMPLETED';
        const isActive = step.status === 'IN_PROGRESS';
        const isPending = step.status === 'PENDING';

        return (
          <div key={step.id} className="flex gap-4">
            {/* Left: dot + line */}
            <div className="flex flex-col items-center">
              <div className="mt-1">
                {isDone ? (
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 my-1 min-h-[2rem] ${isDone ? 'bg-teal-300' : 'bg-slate-200'}`} />
              )}
            </div>

            {/* Right: content */}
            <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <div className={`font-medium text-sm ${isDone ? 'text-teal-700' : isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                {step.step_name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {isDone && step.completed_at ? (
                  <span>Completed {formatTime(step.completed_at)}</span>
                ) : isActive && step.started_at ? (
                  <span className="text-blue-500 font-medium">● In Progress since {formatTime(step.started_at)}</span>
                ) : (
                  <span>Pending</span>
                )}
              </div>
              {step.comments && (
                <div className="mt-1 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">
                  {step.comments}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
