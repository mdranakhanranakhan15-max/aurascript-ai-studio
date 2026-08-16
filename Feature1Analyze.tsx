import React, { useState } from 'react';
import { Upload, Loader2, Sparkles, Check } from 'lucide-react';

interface Feature1Props {
  customApiKey: string;
  targetLanguage: string;
  onSendScriptToMetadata: (script: string) => void;
}

export const Feature1Analyze: React.FC<Feature1Props> = ({
  customApiKey,
  targetLanguage,
  onSendScriptToMetadata,
}) => {
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'auto'>('auto');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Clean raw script text to eliminate any unwanted prefix labels like "**ভয়েসওভার স্ক্রিপ্ট:**"
  const cleanRawScript = (raw: string) => {
    if (!raw) return '';
    return raw
      .replace(/^[\*\s_]*(ভয়েসওভার\s*স্ক্রিপ্ট|Voiceover\s*Script|Script|স্ক্রিপ্ট)[\*\s_]*:[\*\s_]*/i, '')
      .trim();
  };

  // Handle direct file upload (image or audio)
  const processFile = (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setFileMimeType(file.type);

    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('audio/')) {
      setMediaType('audio');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setFileData(base64);
      setErrorMessage('');
      setSuccessMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClearInput = () => {
    setFileData(null);
    setFileName(null);
    setFileMimeType(null);
    setErrorMessage('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fileData) {
      setErrorMessage('Please drop or select an Image or Audio file first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMsg('');

    try {
      let scriptText = '';

      // Try server-side endpoint first (/api/analyze-media)
      try {
        const serverRes = await fetch('/api/analyze-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData,
            mimeType: fileMimeType,
            targetLanguage,
            apiKey: customApiKey,
          }),
        });

        const contentType = serverRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const serverData = await serverRes.json();
          if (serverRes.ok && serverData.success && serverData.script) {
            scriptText = serverData.script;
          } else if (serverRes.status !== 404) {
            throw new Error(serverData.error || 'Server error occurred');
          }
        }
      } catch (serverErr: any) {
        // If it's a real API/quota error (not a 404 missing endpoint), rethrow it
        if (!serverErr.message?.includes('404') && !serverErr.message?.includes('Failed to fetch')) {
          throw serverErr;
        }
      }

      // If server endpoint was not available (e.g., static hosting / Vercel SPA), call Gemini directly
      if (!scriptText) {
        const isBengali =
          targetLanguage.toLowerCase().includes('bengali') ||
          targetLanguage.toLowerCase().includes('বাংলা');

        const promptText = isBengali
          ? `আপনি একজন অত্যন্ত দক্ষ ভিডিও কনটেন্ট ক্রিয়েটর ও মিডিয়া বিশ্লেষক।
প্রদত্ত ছবি (Image) বা অডিও (Audio) ফাইলটি গভীরভাবে বিশ্লেষণ করুন।

কঠোর নিয়মাবলী:
১. সম্পূর্ণ আউটপুট ১০০% শুধুমাত্র বাংলা ভাষায় লিখুন। একটিও ইংরেজি শব্দ, ইংরেজি হরফ বা ইংরেজি হেডার ব্যবহার করবেন না।
২. ছবিটি বা অডিওটির বিষয়বস্তুর সাথে ১০০% মিল রেখে একটি আকর্ষণীয় ও গতিশীল ভয়েসওভার স্ক্রিপ্ট তৈরি করুন।
৩. স্ক্রিপ্টের মোট দৈর্ঘ্য কঠোরভাবে ১৬০ থেকে ১৭০ অক্ষরের (Characters) মধ্যে রাখুন (Target: 160-170 characters for high-engagement Shorts/Reels narration)।
৪. অপ্রয়োজনীয় দীর্ঘ ভূমিকা বা পয়েন্ট না লিখে সরাসরি একটি পড়ার উপযোগী সুন্দর শর্ট ভিডিও/রিলস স্ক্রিপ্ট লিখুন।
৫. কোনো ধরনের হেডার বা টাইটেল (যেমন: "**ভয়েসওভার স্ক্রিপ্ট:**", "ভয়েসওভার স্ক্রিপ্ট:", "স্ক্রিপ্ট:" ইত্যাদি) বা মার্কডাউন চিহ্ন ব্যবহার করবেন না। সরাসরি স্ক্রিপ্টের কথাগুলো লিখুন।`
          : `You are an expert video content creator and media analyst.
Thoroughly analyze the provided image or audio file.

CRITICAL RULES:
1. Write the entire output 100% ONLY in English. Do NOT include any words or terms from other languages.
2. Produce a captivating voiceover script that 100% matches the image or audio provided.
3. STRICT LENGTH REQUIREMENT: Keep the exact length of the script strictly around 160 to 170 characters (approx. 25-32 words, optimal for a punchy shorts narration).
4. Do NOT include unnecessary intros, generic headers, or filler text. Output a clean, ready-to-read script for short video/reels narration.
5. Do NOT include any labels, headings, or prefixes like "**Voiceover Script:**", "Script:", or markdown bold stars. Output ONLY the pure script narration directly.`;

        const payload = {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: fileMimeType || 'image/jpeg',
                    data: fileData,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
        };

        const apiKey = customApiKey.trim();
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
        let lastError: any = null;

        for (const model of models) {
          try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const resData = await response.json();
              if (response.ok && resData.candidates?.[0]?.content?.parts?.[0]?.text) {
                scriptText = resData.candidates[0].content.parts[0].text;
                break;
              } else if (resData?.error?.message) {
                lastError = new Error(resData.error.message);
              }
            }
          } catch (e) {
            lastError = e;
          }
        }

        if (!scriptText) {
          throw lastError || new Error('Could not analyze media with Gemini models. Please verify API key.');
        }
      }

      const cleaned = cleanRawScript(scriptText);
      onSendScriptToMetadata(cleaned);
      setSuccessMsg('✓ Script extracted and sent directly to Script Textarea on the right!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while analyzing media.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="media-analysis" className="py-6 space-y-6">
      {/* Module Title Header - Minimalist Typography with larger sizes */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2.5">
          <span className="text-[#7b9cff] font-mono text-sm uppercase tracking-widest font-bold">01 // STEP ONE</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#7b9cff] animate-pulse"></span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Media Analysis & Script Extraction
        </h2>
        <p className="text-sm sm:text-base text-slate-300 font-mono">
          Drop audio or image files to extract high-impact narration ({targetLanguage})
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Minimalist File Drop Zone */}
        <div className="space-y-3">
          <label className="text-sm font-mono text-slate-300 uppercase tracking-wider block font-bold">
            [ DIRECT FILE UPLOAD ]
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative p-8 sm:p-10 text-center transition-all duration-300 rounded-2xl cursor-pointer ${
              isDragOver
                ? 'bg-[#7b9cff]/15 border-2 border-[#7b9cff] shadow-[0_0_35px_rgba(123,156,255,0.3)]'
                : fileData
                ? 'bg-[#7b9cff]/10 border-2 border-[#7b9cff]/50'
                : 'border-2 border-dashed border-slate-800 hover:border-slate-600 bg-black/50 hover:bg-black/70'
            }`}
          >
            <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#7b9cff]/10 flex items-center justify-center border border-[#7b9cff]/30 text-[#7b9cff]">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1 font-mono">
                <span className="text-sm sm:text-base text-slate-100 font-medium block">
                  {fileName ? (
                    <span className="text-[#7b9cff] font-bold">✓ Loaded: {fileName}</span>
                  ) : (
                    'Drop MP3, WAV, PNG, JPG, JPEG file here or click to browse'
                  )}
                </span>
                <span className="text-xs text-slate-400 block uppercase tracking-wider">
                  Max size: 25MB • Multimodal Audio & Vision Engine
                </span>
              </div>
              <input
                type="file"
                accept="image/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {fileData && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-400 text-xs sm:text-sm transition-colors font-mono font-bold"
              >
                [ Remove ]
              </button>
            )}
          </div>
        </div>

        {/* Media Preview */}
        {fileData && (
          <div className="py-3 border-l-2 border-[#7b9cff] pl-4 font-mono text-sm space-y-2 bg-[#7b9cff]/5 rounded-r-lg">
            <span className="text-[#7b9cff] uppercase font-bold block text-xs tracking-wider">
              PREVIEW ATTACHED:
            </span>
            {fileMimeType?.startsWith('image/') ? (
              <img
                src={`data:${fileMimeType};base64,${fileData}`}
                alt="Preview"
                className="max-h-48 rounded-lg shadow-lg border border-slate-800 object-cover"
              />
            ) : fileMimeType?.startsWith('audio/') ? (
              <audio
                controls
                src={`data:${fileMimeType};base64,${fileData}`}
                className="w-full max-w-md h-10 opacity-90"
              />
            ) : (
              <span className="text-slate-200 block font-semibold">{fileName}</span>
            )}
          </div>
        )}

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-red-950/40 border-l-2 border-red-500 text-red-300 font-mono text-xs sm:text-sm">
            ⚠ {errorMessage}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-[#7b9cff]/10 border-l-2 border-[#7b9cff] text-[#7b9cff] font-mono text-xs sm:text-sm flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Action Button: Glowing Minimalist [ EXTRACT SCRIPT -> ] */}
        <button
          type="submit"
          disabled={isLoading || !fileData}
          className="w-full py-4 px-6 rounded-full bg-[#7b9cff]/10 hover:bg-[#7b9cff]/20 border border-[#7b9cff]/50 hover:border-[#7b9cff] text-[#7b9cff] hover:text-white font-mono text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(123,156,255,0.15)] hover:shadow-[0_0_30px_rgba(123,156,255,0.35)] flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-40 active:scale-98"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#7b9cff]" />
              <span>[ ANALYZING MEDIA CONTENT... ]</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-[#7b9cff]" />
              <span>[ EXTRACT SCRIPT ({targetLanguage}) -&gt; ]</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

