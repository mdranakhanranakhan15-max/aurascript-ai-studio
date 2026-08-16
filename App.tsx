import React, { useState } from 'react';
import { Header } from './components/Header';
import { StudioWorkspace } from './components/StudioWorkspace';
import { ApiCodeModal } from './components/ApiCodeModal';
import { ParticleBackground } from './components/ParticleBackground';

export default function App() {
  const [customApiKey] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('Bengali');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-[#7b9cff] selection:text-black flex flex-col relative overflow-hidden">
      {/* Interactive Canvas Particle Background (#000000 with glowing #7b9cff particles) */}
      <ParticleBackground />

      {/* Top Header Bar */}
      <Header
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        targetLanguage={targetLanguage}
        setTargetLanguage={setTargetLanguage}
      />

      {/* Main Content Studio Workspace */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-6 flex-1 w-full relative z-10">
        <StudioWorkspace
          customApiKey={customApiKey}
          targetLanguage={targetLanguage}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
        />
      </main>

      {/* Minimalist Footer */}
      <footer className="relative z-10 py-6 px-6 sm:px-12 text-xs text-slate-500 font-mono">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7b9cff] animate-pulse"></span>
            <span>AuraScript AI Studio • Powered by Gemini Flash 2.5</span>
          </div>
          <span>Interactive Starfield Canvas Engine</span>
        </div>
      </footer>

      {/* API Code Inspector Modal */}
      <ApiCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}


