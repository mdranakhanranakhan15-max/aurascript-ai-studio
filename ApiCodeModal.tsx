import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code2, Server, Terminal } from 'lucide-react';
import { CodeSnippet } from '../types';

interface ApiCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiCodeModal: React.FC<ApiCodeModalProps> = ({ isOpen, onClose }) => {
  const [snippet, setSnippet] = useState<CodeSnippet | null>(null);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedSdk, setCopiedSdk] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/code-snippet')
        .then((res) => res.json())
        .then((data) => setSnippet(data))
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyJs = () => {
    if (snippet?.fetchApiExample) {
      navigator.clipboard.writeText(snippet.fetchApiExample);
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2000);
    }
  };

  const handleCopySdk = () => {
    if (snippet?.sdkServerExample) {
      navigator.clipboard.writeText(snippet.sdkServerExample);
      setCopiedSdk(true);
      setTimeout(() => setCopiedSdk(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-black border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100 space-y-6 font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#7b9cff]/10 text-[#7b9cff] border border-[#7b9cff]/30 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-[#7b9cff]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Google Gemini API Integration Code</h3>
              <p className="text-xs text-slate-400">
                Includes const API_KEY = 'YOUR_GEMINI_API_KEY' fetch pattern
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs">
          {/* Banner Note */}
          <div className="p-4 rounded-xl bg-[#7b9cff]/5 border border-[#7b9cff]/20 text-[#7b9cff] text-xs leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <span>⚡ Gemini 2.5 Flash / 3.6 Flash REST Integration</span>
            </div>
            <p className="text-slate-300">
              Structured JavaScript fetch API logic with <code className="bg-black px-1.5 py-0.5 rounded text-[#7b9cff]">const API_KEY = 'AQ.Ab8RN6IAEOBE6ewiaB2zUbILhqMsoILcyrODh0uQdhHXCAmSMw'</code>.
            </p>
          </div>

          {/* Snippet 1: Vanilla JS Fetch API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-[#7b9cff]" />
                1. Vanilla JavaScript REST fetch() API Block
              </span>
              <button
                onClick={handleCopyJs}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#7b9cff]/10 hover:bg-[#7b9cff]/20 text-[#7b9cff] border border-[#7b9cff]/30 transition-all text-xs cursor-pointer"
              >
                {copiedJs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#7b9cff]" />}
                <span>{copiedJs ? 'Copied!' : 'Copy Logic'}</span>
              </button>
            </div>
            <pre className="bg-black border border-slate-800 rounded-xl p-4 overflow-x-auto text-[#7b9cff] text-xs leading-relaxed">
              {snippet?.fetchApiExample || `// Loading code snippet...`}
            </pre>
          </div>

          {/* Snippet 2: Server SDK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Server className="w-4 h-4 text-[#7b9cff]" />
                2. Server-side @google/genai SDK Integration
              </span>
              <button
                onClick={handleCopySdk}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#7b9cff]/10 hover:bg-[#7b9cff]/20 text-[#7b9cff] border border-[#7b9cff]/30 transition-all text-xs cursor-pointer"
              >
                {copiedSdk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#7b9cff]" />}
                <span>{copiedSdk ? 'Copied!' : 'Copy Logic'}</span>
              </button>
            </div>
            <pre className="bg-black border border-slate-800 rounded-xl p-4 overflow-x-auto text-[#7b9cff] text-xs leading-relaxed">
              {snippet?.sdkServerExample || `// Loading SDK snippet...`}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#7b9cff]/10 hover:bg-[#7b9cff]/20 border border-[#7b9cff]/40 text-[#7b9cff] font-bold rounded-full text-xs transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
