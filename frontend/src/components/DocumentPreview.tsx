import { CheckCircle, FileText, AlertCircle } from 'lucide-react';
import type { ExtractedDocumentData } from '../types';

interface DocumentPreviewProps {
  filename: string;
  analysis: ExtractedDocumentData;
}

export function DocumentPreview({ filename, analysis }: DocumentPreviewProps) {
  return (
    <div className="cf-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{filename}</p>
          <p className="text-xs text-slate-500">{analysis.document_type}</p>
        </div>
        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
          {analysis.demo_mode ? 'Demo OCR' : analysis.ocr_used ? 'OCR' : 'Analyzed'}
        </span>
      </div>

      {/* Verification checks */}
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Document Analysis</p>
        {analysis.verification_checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
            <span className="text-xs text-slate-700">{check}</span>
          </div>
        ))}
      </div>

      {/* Extracted fields */}
      {Object.keys(analysis.extracted_fields).length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Extracted Fields</p>
          <div className="bg-slate-50 rounded-lg divide-y divide-slate-200">
            {Object.entries(analysis.extracted_fields).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center px-3 py-2">
                <span className="text-xs text-slate-500">{key}</span>
                <span className="text-xs font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Confidence Score</span>
          <span className="font-semibold text-teal-600">{Math.round(analysis.confidence * 100)}%</span>
        </div>
        <div className="h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full"
            style={{ width: `${analysis.confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
