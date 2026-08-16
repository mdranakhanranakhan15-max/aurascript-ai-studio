import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON and large media payloads (e.g., base64 uploads)
  app.use(express.json({ limit: "45mb" }));

  // Helper to get Gemini client
  const getGeminiClient = (customKey?: string) => {
    const key = customKey || process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Helper function to call Gemini with robust retry & fallback model handling
  const callGeminiWithRetry = async (
    ai: GoogleGenAI,
    params: {
      contents: any;
      config?: any;
      preferredModel?: string;
    }
  ) => {
    // Models to cycle through in case of rate limits or model overload (503 / 429)
    const baseModels = [
      params.preferredModel,
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
    ].filter(Boolean) as string[];

    // Remove duplicates while maintaining priority order
    const modelsToTry = Array.from(new Set(baseModels));

    let lastError: any = null;

    for (const model of modelsToTry) {
      // Try up to 3 attempts per model with exponential backoff
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: params.contents,
            config: params.config,
          });
          if (response && (response.text !== undefined || response.candidates)) {
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const errMessage = String(err?.message || err);
          const isTransient =
            errMessage.includes("503") ||
            errMessage.includes("429") ||
            errMessage.includes("UNAVAILABLE") ||
            errMessage.includes("RESOURCE_EXHAUSTED") ||
            errMessage.includes("high demand") ||
            errMessage.includes("overloaded") ||
            errMessage.includes("quota") ||
            errMessage.includes("rate limit") ||
            errMessage.includes("Service Unavailable");

          if (isTransient) {
            const delayMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
            console.warn(
              `[Gemini API] Transient error (${errMessage.slice(0, 80)}...) on model '${model}' (attempt ${attempt + 1}/3). Retrying in ${delayMs}ms...`
            );
            await new Promise((res) => setTimeout(res, delayMs));
          } else {
            // Non-transient error, break to try next fallback model
            break;
          }
        }
      }
    }

    throw lastError;
  };

  // Helper to format clean user error message
  const formatErrorMessage = (err: any): string => {
    const msg = String(err?.message || err);
    if (
      msg.includes("503") ||
      msg.includes("UNAVAILABLE") ||
      msg.includes("high demand") ||
      msg.includes("overloaded")
    ) {
      return "The AI service is currently experiencing high demand. Automatic retry is in place—please wait a few seconds and click try again.";
    }
    if (
      msg.includes("429") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("quota") ||
      msg.includes("rate limit")
    ) {
      return "Gemini API rate limit reached (Free Tier limit). Please wait 10-15 seconds and try again, or enter a custom Gemini API key in the top bar.";
    }
    return msg || "An error occurred while processing your request.";
  };

  // API 1: Analyze Image/Audio Media & Generate Translated Script
  app.post("/api/analyze-media", async (req, res) => {
    try {
      const { mediaUrl, mediaType, fileData, mimeType, targetLanguage = "Bengali", apiKey } = req.body;

      if (!mediaUrl && !fileData) {
        return res.status(400).json({ error: "Please provide either a valid Media URL or upload a file." });
      }

      const ai = getGeminiClient(apiKey);
      const parts: any[] = [];

      let mediaBufferBase64: string | null = fileData || null;
      let detectedMimeType: string = mimeType || "image/jpeg";

      // If mediaUrl was supplied and no direct file data, attempt to download it on server
      if (mediaUrl && !fileData) {
        try {
          const fetchRes = await fetch(mediaUrl);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            mediaBufferBase64 = Buffer.from(arrayBuffer).toString("base64");
            const contentType = fetchRes.headers.get("content-type");
            if (contentType) {
              detectedMimeType = contentType.split(";")[0].trim();
            }
          }
        } catch (fetchErr) {
          console.warn("Could not fetch media URL directly on server, falling back to URL text analysis:", fetchErr);
        }
      }

      if (mediaBufferBase64) {
        parts.push({
          inlineData: {
            data: mediaBufferBase64,
            mimeType: detectedMimeType,
          },
        });
      }

      const isBengali = targetLanguage.toLowerCase().includes("bengali") || targetLanguage.includes("বাংলা");

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

      parts.push({ text: promptText });

      const response = await callGeminiWithRetry(ai, {
        contents: { parts },
      });

      let text = response.text || "স্ক্রিপ্ট তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।";
      // Strip any unwanted meta prefix like **ভয়েসওভার স্ক্রিপ্ট:** or Voiceover Script:
      text = text.replace(/^[\*\s_]*(ভয়েসওভার\s*স্ক্রিপ্ট|Voiceover\s*Script|Script|স্ক্রিপ্ট)[\*\s_]*:[\*\s_]*/i, "").trim();

      return res.json({ script: text, success: true });
    } catch (err: any) {
      console.error("Error in /api/analyze-media:", err);
      return res.status(500).json({
        error: formatErrorMessage(err),
      });
    }
  });

  // API 2: Generate Video/Audio Metadata from Script
  app.post("/api/generate-metadata", async (req, res) => {
    try {
      const { script, apiKey } = req.body;

      if (!script || !script.trim()) {
        return res.status(400).json({ error: "Script text is required to generate metadata." });
      }

      const ai = getGeminiClient(apiKey);

      const prompt = `You are a social media growth strategist and content optimization expert.
Analyze the following video/audio script and generate optimized metadata for platforms like YouTube, TikTok, and Instagram Reels:

Script:
"""
${script}
"""

Generate the output matching this exact JSON schema:
1. title: Main viral title option + 2 alternate title suggestions.
2. description: An engaging description with a summary hook, key takeaways, and call to action.
3. hashtags: 8 to 12 relevant, high-traffic hashtags formatted as a space-separated string starting with '#'.
4. thumbnailText: Bold, punchy 3-5 word high-CTR text overlay for video thumbnails in ALL CAPS.`;

      const response = await callGeminiWithRetry(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Main title option and 2 alternative catchy title hooks.",
              },
              description: {
                type: Type.STRING,
                description: "Full engaging social media description with call to action.",
              },
              hashtags: {
                type: Type.STRING,
                description: "Space-separated hashtag string e.g. #ContentCreation #VideoTips #AI",
              },
              thumbnailText: {
                type: Type.STRING,
                description: "Short, impactful 3 to 5 word thumbnail text overlay in ALL CAPS.",
              },
            },
            required: ["title", "description", "hashtags", "thumbnailText"],
          },
        },
      });

      let responseText = response.text || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        console.warn("Could not parse JSON response directly, returning text object");
        parsed = {
          title: responseText,
          description: "See title output",
          hashtags: "#Content #Video #AI",
          thumbnailText: "WATCH THIS NOW",
        };
      }

      return res.json({ metadata: parsed, success: true });
    } catch (err: any) {
      console.error("Error in /api/generate-metadata:", err);
      return res.status(500).json({
        error: formatErrorMessage(err),
      });
    }
  });

  // API 2b: Generate Individual Metadata Field (Titles, Description, Hashtags, Thumbnail)
  app.post("/api/generate-individual-metadata", async (req, res) => {
    try {
      const { script, field, targetLanguage = "Bengali", apiKey } = req.body;

      if (!script || !script.trim()) {
        return res.status(400).json({ error: "Script text is required." });
      }

      const ai = getGeminiClient(apiKey);
      const isBengali = targetLanguage.toLowerCase().includes("bengali") || targetLanguage.includes("বাংলা");
      let prompt = "";

      if (field === "title") {
        prompt = isBengali
          ? `আপনি একজন ইউটিউব শর্টস ও রিলস ভাইরাল এসইও বিশেষজ্ঞ।
নিচের স্ক্রিপ্টটির ওপর ভিত্তি করে ইউটিউব শর্টস/টিকটকের জন্য উপযুক্ত ঠিক ৫টি অতি সংক্ষিপ্ত, আকর্ষক ও ভাইরাল শর্টস টাইটেল (Shorts Titles) তৈরি করুন।

কঠোর নিয়মাবলী:
১. আউটপুট ১০০% শুধুমাত্র বাংলা ভাষায় লিখুন। কোন ইংরেজি শব্দ বা হরফ ব্যবহার করা যাবে না।
২. টাইটেলগুলো ছোট ও ক্যাচি (Shorts Title) হতে হবে, বড় লম্বা বাক্য হওয়া যাবে না।
৩. ১ থেকে ৫ পর্যন্ত নম্বর দিয়ে শুধুমাত্র ৫টি শর্টস টাইটেল দিন।

স্ক্রিপ্ট:
"""
${script}
"""`
          : `You are a YouTube Shorts & Reels viral SEO expert.
Based on the following script, generate EXACTLY 5 short, punchy, catchy viral Shorts titles.

CRITICAL RULES:
1. Write 100% ONLY in English.
2. Keep each title short and catchy (ideal for YouTube Shorts / Reels, NOT long sentences).
3. Return numbered 1 to 5 with exactly 5 title options.

Script:
"""
${script}
"""`;
      } else if (field === "description") {
        prompt = isBengali
          ? `আপনি একজন ডিজিটাল কনটেন্ট বিশেষজ্ঞ।
নিচের স্ক্রিপ্টটির ওপর ভিত্তি করে ঠিক ১টি সুন্দর ও সংক্ষিপ্ত ভিডিও ডেসক্রিপশন (Video Description) লিখুন।

কঠোর নিয়মাবলী:
১. আউটপুট ১০০% শুধুমাত্র বাংলা ভাষায় লিখুন। একটিও ইংরেজি শব্দ ব্যবহার করা সম্পূর্ণ নিষেধ।
২. ঠিক ১টি সংক্ষিপ্ত ডেসক্রিপশন লিখুন যা ভিডিওর মূল কথা প্রকাশ করে এবং দর্শকদের চ্যানেল লাইক/সাবস্ক্রাইব করতে বলে।

স্ক্রিপ্ট:
"""
${script}
"""`
          : `You are a digital content expert.
Based on the following script, write EXACTLY 1 concise, engaging video description.

CRITICAL RULES:
1. Write 100% ONLY in English.
2. Output exactly 1 short description paragraph with a call-to-action.

Script:
"""
${script}
"""`;
      } else if (field === "hashtags") {
        prompt = isBengali
          ? `নিচের স্ক্রিপ্টটির ওপর ভিত্তি করে শর্টস ও টিকটকের জন্য সবচেয়ে জনপ্রিয় ঠিক ৪টি হ্যাশট্যাগ (#) তৈরি করুন।

কঠোর নিয়মাবলী:
১. স্পেস দিয়ে আলাদা করে ঠিক ৪টি হ্যাশট্যাগ দিন (যেমন: #ভাইরাল #শর্টস #ভিডিও #ট্রেন্ডিং)।
২. ৪টির বেশি বা ৪টির কম হ্যাশট্যাগ দিবেন না।

স্ক্রিপ্ট:
"""
${script}
"""`
          : `Based on the following script, generate EXACTLY 4 trending, high-traffic hashtags for Shorts and Reels.

CRITICAL RULES:
1. Output EXACTLY 4 hashtags separated by spaces (e.g. #Viral #Shorts #Trending #Video).
2. Do NOT provide more or less than 4 hashtags.

Script:
"""
${script}
"""`;
      } else if (field === "thumbnailText") {
        prompt = isBengali
          ? `নিচের স্ক্রিপ্টটির ওপর ভিত্তি করে ভিডিও থাম্বনেইলের ওপর লেখার জন্য ঠিক ৩টি অত্যন্ত আকর্ষক ও ছোট টেক্সট আইডিয়া (Thumbnail Text) তৈরি করুন (প্রতিটি ২-৪ শব্দের)।

কঠোর নিয়মাবলী:
১. আউটপুট ১০০% শুধুমাত্র বাংলা ভাষায় লিখুন।
২. ১, ২, ৩ নম্বর দিয়ে ঠিক ৩টি ছোট থাম্বনেইল টেক্সট আইডিয়া দিন।

স্ক্রিপ্ট:
"""
${script}
"""`
          : `Based on the following script, generate EXACTLY 3 high-CTR short thumbnail text overlay ideas (2-4 words max each).

CRITICAL RULES:
1. Write 100% ONLY in English in ALL CAPS.
2. Return numbered 1, 2, 3 with exactly 3 ideas.

Script:
"""
${script}
"""`;
      } else {
        return res.status(400).json({ error: "Invalid field specified." });
      }

      const response = await callGeminiWithRetry(ai, {
        contents: prompt,
      });

      return res.json({ result: response.text || "No output generated.", success: true });
    } catch (err: any) {
      console.error("Error in /api/generate-individual-metadata:", err);
      return res.status(500).json({
        error: formatErrorMessage(err),
      });
    }
  });

  // API 3: Fetch exact API logic snippet for Gemini 3.6 Flash
  app.get("/api/code-snippet", (req, res) => {
    const snippet = {
      model: "gemini-3.6-flash",
      apiKeyPlaceholder: "YOUR_GEMINI_API_KEY",
      fetchApiExample: `// Vanilla JS / Fetch API Call Example
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

// 1. Analyze Media & Translate Script
async function analyzeMediaAndTranslate(mediaUrl, targetLanguage) {
  const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=\${GEMINI_API_KEY}\`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: \`Analyze media from \${mediaUrl} and translate to \${targetLanguage}\` }
        ]
      }]
    })
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// 2. Generate Metadata from Script
async function generateMetadata(script) {
  const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=\${GEMINI_API_KEY}\`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: \`Generate Title, Description, Hashtags, and Thumbnail Text for script:\\n\${script}\` }
        ]
      }]
    })
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}`,
      sdkServerExample: `// Node.js @google/genai SDK standard
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY"
});

const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: "Your prompt here..."
});
console.log(response.text);`
    };

    return res.json(snippet);
  });

  // Serve Vite app in dev or static dist in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
