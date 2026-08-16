import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Loader2, Hash, Type, AlignLeft } from 'lucide-react';
import { MetadataResult } from '../types';
import { useTypewriter } from '../utils/useTypewriter';

interface Feature2Props {
  customApiKey: string;
  targetLanguage: string;
  incomingScript: string;
}

// Sub-component for smooth animated typing in metadata result cards
const TypewriterDisplay: React.FC<{
  text: string;
  className?: string;
  speedMs?: number;
}> = ({ text, className = '', speedMs = 15 }) => {
  const { displayedText, isTyping } = useTypewriter(text, speedMs);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-[#7b9cff] animate-pulse align-middle" />
      )}
    </span>
  );
};

export const Feature2Metadata: React.FC<Feature2Props> = ({
  customApiKey,
  targetLanguage,
  incomingScript,
}) => {
  const [scriptInput, setScriptInput] = useState<string>('');
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<MetadataResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Individual loading states
  const [loadingField, setLoadingField] = useState<string | null>(null);

  // Typewriter effect when incoming script arrives from Step 1
  useEffect(() => {
    if (incomingScript) {
      let currentIdx = 0;
      const full = incomingScript;
      setScriptInput('');
      const step = full.length > 280 ? 3 : full.length > 150 ? 2 : 1;
      
      const timer = setInterval(() => {
        currentIdx = Math.min(currentIdx + step, full.length);
        setScriptInput(full.slice(0, currentIdx));
        if (currentIdx >= full.length) {
          clearInterval(timer);
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [incomingScript]);

  // Master Golden Button Handler: Generate All Metadata simultaneously
  const handleGenerateAllMetadata = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!scriptInput.trim()) {
      setErrorMessage('Please paste or enter a script in the input box first.');
      return;
    }

    setIsGeneratingAll(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptInput.trim(),
          apiKey: customApiKey,
        }),
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(
          `Server returned status ${response.status} (${response.statusText || 'Error'}). ${
            textError.length > 200 ? textError.slice(0, 200) + '...' : textError
          }`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate metadata.');
      }

      setMetadata(data.metadata);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while generating metadata.');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Individual field generator handler
  const handleGenerateIndividualField = async (field: 'title' | 'description' | 'hashtags' | 'thumbnailText') => {
    if (!scriptInput.trim()) {
      setErrorMessage('Please paste or enter a script in the input box first.');
      return;
    }

    setLoadingField(field);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate-individual-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptInput.trim(),
          field,
          targetLanguage,
          apiKey: customApiKey,
        }),
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(
          `Server returned status ${response.status} (${response.statusText || 'Error'}). ${
            textError.length > 200 ? textError.slice(0, 200) + '...' : textError
          }`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to generate ${field}`);
      }

      setMetadata((prev) => ({
        title: field === 'title' ? data.result : prev?.title || '',
        description: field === 'description' ? data.result : prev?.description || '',
        hashtags: field === 'hashtags' ? data.result : prev?.hashtags || '',
        thumbnailText: field === 'thumbnailText' ? data.result : prev?.thumbnailText || '',
      }));
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || `Failed to generate ${field}`);
    } finally {
      setLoadingField(null);
    }
  };

  const handleCopyText = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    if (!metadata) return;
    const combined = `TITLE:\n${metadata.title}\n\nDESCRIPTION:\n${metadata.description}\n\nHASHTAGS:\n${metadata.hashtags}\n\nTHUMBNAIL TEXT:\n${metadata.thumbnailText}`;
    navigator.clipboard.writeText(combined);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const charCount = scriptInput.length;
  const isNearTarget = charCount >= 150 && charCount <= 180;

  return (
    <div id="metadata-engine" className="space-y-8 py-6">
      {/* Step 2 Script Area */}
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="text-[#7b9cff] font-mono text-sm uppercase tracking-widest font-bold">02 // STEP TWO</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#7b9cff] animate-pulse"></span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Script Workspace & Source Input
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-mono">
            Directly populated from Step 1 with smooth typing, or type/paste custom narration below
          </p>
        </div>

        <form onSubmit={handleGenerateAllMetadata} className="space-y-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-sm text-slate-300">
              <label className="uppercase tracking-wider font-bold">[ SCRIPT CONTENT ]</label>
              <div className="flex items-center space-x-4">
                <span className={`px-2.5 py-0.5 rounded-full border text-xs sm:text-sm font-semibold transition-all ${
                  isNearTarget 
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300' 
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}>
                  Chars: <span className="font-bold text-white">{charCount}</span>
                  <span className="text-slate-400 ml-1.5 text-xs font-normal">(160-170 target)</span>
                </span>
                {scriptInput && (
                  <button
                    type="button"
                    onClick={() => setScriptInput('')}
                    className="text-slate-400 hover:text-red-400 uppercase tracking-wider text-xs sm:text-sm transition-colors font-medium cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>
            </div>

            {/* Minimalist Terminal Textarea with larger typography */}
            <textarea
              rows={5}
              placeholder="Script content will automatically type out here after Media Analysis, or paste custom narration..."
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              className="w-full bg-black/60 border-2 border-slate-800 hover:border-slate-600 focus:border-[#7b9cff] rounded-xl transition-colors p-4 sm:p-5 text-base sm:text-lg text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono leading-relaxed shadow-inner"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-950/40 border-l-2 border-red-500 text-red-300 font-mono text-xs sm:text-sm">
              ⚠ {errorMessage}
            </div>
          )}

          {/* Master Generation Button */}
          <button
            type="submit"
            disabled={isGeneratingAll || !scriptInput.trim()}
            className="w-full py-4 px-6 rounded-full bg-[#7b9cff]/10 hover:bg-[#7b9cff]/20 border border-[#7b9cff]/50 hover:border-[#7b9cff] text-[#7b9cff] hover:text-white font-mono text-sm sm:text-base font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(123,156,255,0.15)] hover:shadow-[0_0_30px_rgba(123,156,255,0.35)] flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-40 active:scale-98"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#7b9cff]" />
                <span>[ GENERATING METADATA PACKAGE... ]</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#7b9cff]" />
                <span>[ GENERATE METADATA PACKAGE ({targetLanguage}) -&gt; ]</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Step 3: Floating 2x2 Grid Output Cards with larger typography & typewriter effect */}
      <div className="space-y-5 pt-6 border-t border-slate-900">
        <div className="flex items-center justify-between font-mono">
          <div className="flex items-center space-x-3">
            <span className="text-[#7b9cff] text-sm uppercase tracking-widest font-bold">03 // STEP THREE</span>
            <span className="text-white text-base sm:text-lg font-bold tracking-tight">// METADATA RESULTS</span>
          </div>

          {metadata && (
            <button
              onClick={handleCopyAll}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#7b9cff]/10 hover:bg-[#7b9cff]/20 text-[#7b9cff] text-xs sm:text-sm font-mono font-medium transition-all border border-[#7b9cff]/30 cursor-pointer"
            >
              {copiedField === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#7b9cff]" />}
              <span>{copiedField === 'all' ? 'Copied All!' : 'Copy All Results'}</span>
            </button>
          )}
        </div>

        {/* 2x2 Independently Floating Minimalist Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Viral Shorts Titles */}
          <div className="p-6 border-l-2 border-[#7b9cff]/50 hover:border-[#7b9cff] transition-colors space-y-4 bg-black/40 rounded-r-xl">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2.5">
                <Type className="w-4.5 h-4.5 text-[#7b9cff]" />
                VIRAL SHORTS TITLES
              </span>
              <div className="flex items-center space-x-2">
                {metadata?.title && (
                  <button
                    onClick={() => handleCopyText('title', metadata.title)}
                    className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                    title="Copy titles"
                  >
                    {copiedField === 'title' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleGenerateIndividualField('title')}
                  disabled={loadingField === 'title'}
                  className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                  title="Regenerate titles"
                >
                  {loadingField === 'title' ? <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" /> : <Sparkles className="w-4 h-4 text-[#7b9cff]" />}
                </button>
              </div>
            </div>

            <div className="font-mono text-sm sm:text-base text-slate-200 min-h-[110px]">
              {loadingField === 'title' ? (
                <div className="flex items-center space-x-2 text-[#7b9cff] py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" />
                  <span>Generating titles...</span>
                </div>
              ) : metadata?.title ? (
                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  <TypewriterDisplay text={metadata.title} />
                </div>
              ) : (
                <span className="text-slate-600 italic block py-4">
                  // Viral hook titles will appear here...
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Video Description */}
          <div className="p-6 border-l-2 border-[#7b9cff]/50 hover:border-[#7b9cff] transition-colors space-y-4 bg-black/40 rounded-r-xl">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2.5">
                <AlignLeft className="w-4.5 h-4.5 text-[#7b9cff]" />
                VIDEO DESCRIPTION
              </span>
              <div className="flex items-center space-x-2">
                {metadata?.description && (
                  <button
                    onClick={() => handleCopyText('desc', metadata.description)}
                    className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                    title="Copy description"
                  >
                    {copiedField === 'desc' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleGenerateIndividualField('description')}
                  disabled={loadingField === 'description'}
                  className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                  title="Regenerate description"
                >
                  {loadingField === 'description' ? <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" /> : <Sparkles className="w-4 h-4 text-[#7b9cff]" />}
                </button>
              </div>
            </div>

            <div className="font-mono text-sm sm:text-base text-slate-200 min-h-[110px] max-h-60 overflow-y-auto">
              {loadingField === 'description' ? (
                <div className="flex items-center space-x-2 text-[#7b9cff] py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" />
                  <span>Generating description...</span>
                </div>
              ) : metadata?.description ? (
                <p className="whitespace-pre-line text-slate-200 leading-relaxed">
                  <TypewriterDisplay text={metadata.description} />
                </p>
              ) : (
                <span className="text-slate-600 italic block py-4">
                  // SEO optimized description will appear here...
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Trending Hashtags */}
          <div className="p-6 border-l-2 border-[#7b9cff]/50 hover:border-[#7b9cff] transition-colors space-y-4 bg-black/40 rounded-r-xl">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2.5">
                <Hash className="w-4.5 h-4.5 text-[#7b9cff]" />
                TRENDING HASHTAGS
              </span>
              <div className="flex items-center space-x-2">
                {metadata?.hashtags && (
                  <button
                    onClick={() => handleCopyText('hashtags', metadata.hashtags)}
                    className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                    title="Copy hashtags"
                  >
                    {copiedField === 'hashtags' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleGenerateIndividualField('hashtags')}
                  disabled={loadingField === 'hashtags'}
                  className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                  title="Regenerate hashtags"
                >
                  {loadingField === 'hashtags' ? <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" /> : <Sparkles className="w-4 h-4 text-[#7b9cff]" />}
                </button>
              </div>
            </div>

            <div className="font-mono text-base sm:text-lg text-[#7b9cff] min-h-[100px]">
              {loadingField === 'hashtags' ? (
                <div className="flex items-center space-x-2 text-[#7b9cff] py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" />
                  <span>Generating hashtags...</span>
                </div>
              ) : metadata?.hashtags ? (
                <p className="leading-relaxed break-words font-semibold">
                  <TypewriterDisplay text={metadata.hashtags} />
                </p>
              ) : (
                <span className="text-slate-600 italic block py-4 text-sm sm:text-base">
                  // Trending hashtags will appear here...
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Thumbnail Text */}
          <div className="p-6 border-l-2 border-[#7b9cff]/50 hover:border-[#7b9cff] transition-colors space-y-4 bg-black/40 rounded-r-xl">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-[#7b9cff]" />
                THUMBNAIL TEXT OVERLAY
              </span>
              <div className="flex items-center space-x-2">
                {metadata?.thumbnailText && (
                  <button
                    onClick={() => handleCopyText('thumbnail', metadata.thumbnailText)}
                    className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                    title="Copy thumbnail text"
                  >
                    {copiedField === 'thumbnail' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleGenerateIndividualField('thumbnailText')}
                  disabled={loadingField === 'thumbnailText'}
                  className="p-1.5 text-slate-400 hover:text-[#7b9cff] transition-colors cursor-pointer"
                  title="Regenerate thumbnail text"
                >
                  {loadingField === 'thumbnailText' ? <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" /> : <Sparkles className="w-4 h-4 text-[#7b9cff]" />}
                </button>
              </div>
            </div>

            <div className="font-mono text-slate-100 min-h-[100px] flex items-center justify-center">
              {loadingField === 'thumbnailText' ? (
                <div className="flex items-center space-x-2 text-[#7b9cff] py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7b9cff]" />
                  <span>Generating overlay text...</span>
                </div>
              ) : metadata?.thumbnailText ? (
                <div className="w-full bg-[#7b9cff]/10 border border-[#7b9cff]/30 p-4 rounded-lg text-center">
                  <span className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase">
                    "<TypewriterDisplay text={metadata.thumbnailText} />"
                  </span>
                </div>
              ) : (
                <span className="text-slate-600 italic block py-4 text-sm sm:text-base text-center w-full">
                  // High-CTR thumbnail overlay text will appear here...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
