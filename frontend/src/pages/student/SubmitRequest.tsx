import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, FileText, Brain, Check, Loader2,
  ChevronRight, Sparkles, Play
} from 'lucide-react';
import { StudentLayout } from '../../layouts/StudentLayout';
import { createRequest, classifyRequest, uploadDocument } from '../../services/requests';
import { AIAnalysisCard } from '../../components/AIAnalysisCard';
import { DocumentPreview } from '../../components/DocumentPreview';
import type { AIAnalysisResult, ExtractedDocumentData } from '../../types';

type Stage = 'input' | 'analyzing' | 'result' | 'uploading' | 'done';

const AI_STEPS = [
  'Understanding request',
  'Identifying service',
  'Detecting department',
  'Detecting priority & urgency',
  'Checking supporting documents',
  'Creating workflow',
  'Assigning SLA',
];

const DEMO_SCENARIO = {
  text: 'I need a bonafide certificate for my scholarship application tomorrow. Please process it urgently.',
  filename: 'student_id.pdf',
};

export function SubmitRequest() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('input');
  const [aiStepsDone, setAiStepsDone] = useState<number>(0);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<ExtractedDocumentData | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const loadDemoScenario = () => {
    setDescription(DEMO_SCENARIO.text);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please describe your request');
      return;
    }
    setError('');
    setStage('analyzing');
    setAiStepsDone(0);

    try {
      // Create request
      const req = await createRequest(description);
      setRequestId(req.id);

      // Animate AI steps
      for (let i = 0; i < AI_STEPS.length; i++) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
        setAiStepsDone(i + 1);
      }

      // Classify
      const result = await classifyRequest(req.id);
      setAiResult(result);

      // Handle file upload if present
      if (file) {
        setStage('uploading');
        try {
          const doc = await uploadDocument(req.id, file);
          if (doc.extracted_data) {
            const parsed = JSON.parse(doc.extracted_data);
            setDocAnalysis(parsed);
          }
        } catch {
          // Document upload is non-blocking
        }
      }

      setStage('result');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
      setStage('input');
    }
  };

  const goToRequest = () => {
    if (requestId) navigate(`/student/requests/${requestId}`);
  };

  return (
    <StudentLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">How can we help you?</h1>
          <p className="text-slate-500 text-sm mt-1">
            Describe your issue in your own words — AI will understand and route it automatically
          </p>
        </div>

        {/* Input Stage */}
        {(stage === 'input') && (
          <div className="space-y-4">
            {/* Demo button */}
            <button
              onClick={loadDemoScenario}
              id="load-demo-btn"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium hover:bg-teal-100 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Load Demo Scenario
            </button>

            {/* Text input */}
            <div className="cf-card p-4">
              <textarea
                id="request-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[140px] text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none"
                placeholder="Describe your problem or request in your own words...&#10;&#10;Example: I need a bonafide certificate for my scholarship application tomorrow."
              />
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{description.length} characters</span>
                <span className="text-xs text-slate-400">AI will classify your request</span>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Supporting Document <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Drop your file here or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, JPEG · Max 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                </div>
              ) : (
                <div className="cf-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              id="analyze-submit-btn"
              onClick={handleSubmit}
              disabled={!description.trim()}
              className="btn-primary w-full py-3 text-base"
            >
              <Brain className="w-5 h-5" />
              Analyze & Submit Request
            </button>
          </div>
        )}

        {/* AI Analysis Animation */}
        {(stage === 'analyzing' || stage === 'uploading') && (
          <div className="cf-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Brain className="w-5 h-5 text-teal-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">AI Analysis</h3>
                <p className="text-xs text-slate-500">
                  {stage === 'uploading' ? 'Analyzing document...' : 'Processing your request...'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {AI_STEPS.map((step, i) => {
                const isDone = i < aiStepsDone;
                const isActive = i === aiStepsDone;
                return (
                  <div key={step} className={`ai-step ${isDone ? 'ai-step-done' : isActive ? 'ai-step-active' : 'ai-step-pending'}`}>
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-teal-600" />
                      </div>
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            {stage === 'uploading' && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing uploaded document...
              </div>
            )}
          </div>
        )}

        {/* Result Stage */}
        {stage === 'result' && aiResult && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-teal-700 text-sm font-medium">
              <Check className="w-4 h-4" />
              Analysis complete — your request has been classified and workflow created
            </div>

            <AIAnalysisCard result={aiResult} />

            {docAnalysis && (
              <DocumentPreview
                filename={file?.name || 'document'}
                analysis={docAnalysis}
              />
            )}

            <div className="flex gap-3">
              <button
                id="track-request-btn"
                onClick={goToRequest}
                className="btn-primary flex-1 py-3"
              >
                Track My Request
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setStage('input');
                  setDescription('');
                  setFile(null);
                  setAiResult(null);
                  setDocAnalysis(null);
                }}
                className="btn-secondary px-4"
              >
                New Request
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
