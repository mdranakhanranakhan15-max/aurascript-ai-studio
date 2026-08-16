import React from 'react';
import { Sparkles, Globe, Download } from 'lucide-react';

interface HeaderProps {
  onOpenCodeModal?: () => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
}

const TARGET_LANGUAGES = [
  'Bengali',
  'English',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Mandarin Chinese',
  'Hindi',
  'Portuguese',
  'Arabic',
  'Russian',
  'Italian',
  'Korean',
];

export const Header: React.FC<HeaderProps> = ({
  targetLanguage,
  setTargetLanguage,
}) => {
  return (
    <header className="sticky top-0 z-30 py-5 px-6 sm:px-12 backdrop-blur-sm bg-black/40 border-b border-slate-900/60">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-6">
        {/* Brand Logo & Title - Pure Typography */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-[#7b9cff]/10 text-[#7b9cff] flex items-center justify-center border border-[#7b9cff]/20 shadow-[0_0_15px_rgba(123,156,255,0.2)] group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 text-[#7b9cff]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              AuraScript
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-wider">
              ZERO-G MULTIMODAL METADATA ENGINE
            </p>
          </div>
        </div>

        {/* Minimalist Navigation & Actions */}
        <div className="flex items-center space-x-6 text-sm font-mono tracking-wider">
          {/* Plain Text Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-slate-300">
            <a
              href="#media-analysis"
              className="hover:text-[#7b9cff] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#7b9cff] hover:after:w-full after:transition-all"
            >
              Enterprise
            </a>
            <a
              href="#metadata-engine"
              className="hover:text-[#7b9cff] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#7b9cff] hover:after:w-full after:transition-all"
            >
              Resources
            </a>
          </nav>

          {/* Language Switcher - Minimal Underline Style */}
          <div className="flex items-center space-x-2 text-slate-300 border-b border-slate-700 hover:border-[#7b9cff] pb-1 transition-colors">
            <Globe className="w-4 h-4 text-[#7b9cff]" />
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-transparent text-slate-200 text-sm font-mono focus:outline-none cursor-pointer pr-1"
            >
              {TARGET_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-black text-slate-200">
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Simple Rounded Download / Launch Button */}
          <button
            onClick={() => {
              const el = document.getElementById('media-analysis');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 bg-[#7b9cff]/10 hover:bg-[#7b9cff]/20 text-[#7b9cff] border border-[#7b9cff]/40 px-5 py-2 rounded-full text-sm font-mono font-medium transition-all shadow-[0_0_15px_rgba(123,156,255,0.15)] hover:shadow-[0_0_25px_rgba(123,156,255,0.35)] cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download App</span>
          </button>
        </div>
      </div>
    </header>
  );
};


