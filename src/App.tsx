/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "motion/react";
import { Globe, Rocket, Sparkles, Image as ImageIcon, Share2, Loader2, TrendingUp, Zap, Crown, ShieldCheck, Info } from 'lucide-react';

const COUNTRIES = ["USA", "India", "Japan", "Brazil", "Germany", "UK", "France", "South Korea", "Mexico", "Nigeria"];

export default function App() {
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('USA');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [result, setResult] = useState<{ strategy: string; imageUrl: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  const fetchTrendingTopics = async () => {
    setLoadingTrends(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: "List 5 currently trending viral topics or news events globally that would make good memes. Return only a JSON array of strings.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const trends = JSON.parse(response.text || "[]");
      setTrendingTopics(trends);
    } catch (error) {
      console.error("Failed to fetch trends:", error);
      setTrendingTopics(["AI Takeover", "Crypto Volatility", "Space Exploration", "Global Sports", "Tech Layoffs"]);
    } finally {
      setLoadingTrends(false);
    }
  };

  const generateMeme = async (customTopic?: string) => {
    const activeTopic = customTopic || topic;
    if (!activeTopic) return;
    if (customTopic) setTopic(customTopic);
    
    setLoading(true);
    setImageLoading(true);
    setResult(null);

    try {
      // Using the provided API key as a fallback for the user
      const apiKey = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") 
        ? process.env.GEMINI_API_KEY 
        : "AIzaSyCn4yp1aet5J_txaqTlFfD9qOWBCn8qSk8";

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Create a viral meme for "${activeTopic}" in ${country}. 
        Return a JSON object with:
        - "strategy": Short viral strategy, local caption, and cultural context in markdown.
        - "imagePrompt": A concise, highly descriptive prompt (max 20 words) for an AI image generator. Focus on a single character and a simple background. No text.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategy: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ["strategy", "imagePrompt"]
          }
        }
      });

      let strategy = "Failed to generate strategy.";
      let imagePrompt = `meme about ${activeTopic} in ${country}`;

      try {
        const text = response.text || "{}";
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);
        strategy = data.strategy || strategy;
        imagePrompt = data.imagePrompt || imagePrompt;
      } catch (e) {
        console.error("JSON parse failed, using raw text as strategy");
        strategy = response.text || strategy;
      }
      
      const query = encodeURIComponent(imagePrompt.substring(0, 150));
      const size = isPremium ? 1024 : 512;
      const imageUrl = `https://pollinations.ai/p/${query}?width=${size}&height=${size}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

      console.log("Generated Image URL:", imageUrl);
      setResult({ strategy, imageUrl });
    } catch (error) {
      console.error("Generation failed:", error);
      setImageLoading(false);
      const errorMessage = error instanceof Error ? error.message : "AI server is currently busy or the topic was restricted.";
      setResult({ 
        strategy: `### ⚠️ Generation Failed\n\n${errorMessage}\n\n**Possible reasons:**\n- API Key missing or invalid\n- Topic restricted by AI safety filters\n- Network connectivity issues`,
        imageUrl: "https://picsum.photos/seed/error/1024/1024?blur=2"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#00FF00] selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 p-6 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#00FF00] p-2 rounded-sm rotate-3">
            <Globe className="text-black w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">
            Meme-X <span className="text-[#00FF00]">Global Viral Engine</span>
          </h1>
          <div className="ml-4 px-2 py-0.5 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded text-[8px] font-bold text-[#00FF00] uppercase tracking-widest flex items-center gap-1">
            <Zap size={8} className="fill-[#00FF00]" /> Turbo Mode Active
          </div>
        </div>
        <p className="hidden xl:block text-[10px] text-white/40 max-w-[200px] leading-tight">
          Duniya ka sabse powerful AI Meme Wrapper. Generate memes for any country instantly.
        </p>
        
        <div className="flex items-center gap-6">
          {/* Premium Toggle */}
          <button 
            onClick={() => setIsPremium(!isPremium)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
              isPremium 
                ? "bg-[#00FF00] border-[#00FF00] text-black font-bold shadow-[0_0_20px_rgba(0,255,0,0.3)]" 
                : "bg-white/5 border-white/20 text-white/60 hover:border-white/40"
            }`}
          >
            {isPremium ? <ShieldCheck size={18} /> : <Crown size={18} />}
            <span className="text-xs uppercase tracking-widest">{isPremium ? "Premium Active" : "Go Premium"}</span>
          </button>

          <div className="hidden lg:flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
            <span>Viral OS v2.1</span>
            <span className="w-1 h-1 bg-white rounded-full"></span>
            <span>Real-time Trends</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid lg:grid-cols-[350px_1fr_250px] gap-8 mt-8">
        {/* Sidebar Controls */}
        <aside className="space-y-8">
          <section className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#00FF00] flex items-center gap-2">
                <TrendingUp size={12} /> Global Trend Scanner
              </label>
              <input
                type="text"
                placeholder="e.g. AI Takeover, Crypto Crash..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-black border border-white/20 p-4 rounded-xl focus:outline-none focus:border-[#00FF00] transition-colors text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#00FF00] flex items-center gap-2">
                <Globe size={12} /> Target Market
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-black border border-white/20 p-4 rounded-xl focus:outline-none focus:border-[#00FF00] transition-colors appearance-none cursor-pointer"
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => generateMeme()}
              disabled={loading || !topic}
              className="w-full bg-[#00FF00] text-black font-black uppercase py-4 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" />
                  <span>Turbo Generating...</span>
                </div>
              ) : (
                <>
                  <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Generate Viral Meme
                </>
              )}
            </button>
          </section>

          <div className="p-6 border border-dashed border-white/20 rounded-2xl opacity-50 text-xs leading-relaxed">
            <p className="flex items-center gap-2 mb-2 font-bold text-[#00FF00]">
              <Zap size={14} /> SYSTEM STATUS
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>API Status:</span>
                <span className="text-[#00FF00]">Connected (Auto-Set)</span>
              </div>
              {isPremium ? (
                <span className="text-white">Premium mode enabled. Watermarks removed. High-priority generation active.</span>
              ) : (
                <span>Free mode active. Images will include a Meme-X watermark. Upgrade to Premium for clean exports.</span>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="min-h-[600px] relative">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-3xl"
              >
                <div className="bg-white/5 p-8 rounded-full mb-6">
                  <Sparkles className="w-12 h-12 text-white/20" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready for Global Domination?</h2>
                <p className="text-white/40 max-w-md">
                  Enter a topic or pick a trending one from the sidebar to generate a culturally optimized viral meme.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-[#00FF00]/20 border-t-[#00FF00] rounded-full animate-spin"></div>
                  <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00FF00] animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold uppercase tracking-tighter italic">
                    {imageLoading ? "Rendering Visual..." : "Analyzing Global Trends..."}
                  </h3>
                  <p className="text-white/40 text-sm animate-pulse">
                    {imageLoading 
                      ? "Optimizing for viral distribution..." 
                      : `Scanning ${country} cultural patterns for "${topic}"...`}
                  </p>
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Visual */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#00FF00] flex items-center gap-2">
                        <ImageIcon size={12} /> AI Generated Visual
                      </h3>
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded uppercase font-bold">1080x1080</span>
                    </div>
                    <div className="aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 group relative flex items-center justify-center">
                      {imageLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                          <Loader2 className="w-12 h-12 text-[#00ff41] animate-spin mb-4" />
                          <p className="text-xs font-mono text-[#00ff41] animate-pulse">GENERATING VISUAL...</p>
                        </div>
                      )}
                      <img
                        key={result.imageUrl}
                        src={result.imageUrl}
                        alt="Generated Meme"
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoading ? 'opacity-30 blur-md scale-95' : 'opacity-100 blur-0 scale-100'}`}
                        referrerPolicy="no-referrer"
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                      />
                      
                      {/* Watermark */}
                      {!isPremium && !imageLoading && (
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-none">
                          <Globe size={12} className="text-[#00FF00]" />
                          <span className="text-[10px] font-black tracking-tighter uppercase italic">
                            Made by <span className="text-[#00FF00]">Meme-X</span>
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 gap-2">
                        <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#00FF00] transition-colors">
                          <Share2 size={14} /> Save
                        </button>
                        <button 
                          onClick={() => {
                            const newSeed = Math.floor(Math.random() * 1000000);
                            const baseUrl = result.imageUrl.split('?')[0];
                            const params = new URLSearchParams(result.imageUrl.split('?')[1]);
                            params.set('seed', newSeed.toString());
                            const newUrl = `${baseUrl}?${params.toString()}`;
                            setImageLoading(true);
                            setResult({ ...result, imageUrl: newUrl });
                          }}
                          className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#00FF00] hover:text-black transition-all"
                        >
                          <Sparkles size={14} /> Regenerate
                        </button>
                      </div>
                      
                      {imageLoading && (
                        <button 
                          onClick={() => {
                            const newSeed = Math.floor(Math.random() * 1000000);
                            const baseUrl = result.imageUrl.split('?')[0];
                            const params = new URLSearchParams(result.imageUrl.split('?')[1]);
                            params.set('seed', newSeed.toString());
                            const newUrl = `${baseUrl}?${params.toString()}`;
                            setImageLoading(true);
                            setResult({ ...result, imageUrl: newUrl });
                          }}
                          className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-[10px] px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 hover:bg-white hover:text-black transition-all z-20"
                        >
                          <Zap size={12} className="text-[#00FF00]" /> Force Reload
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Strategy */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#00FF00] flex items-center gap-2">
                      <Zap size={12} /> Viral Strategy
                    </h3>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl prose prose-invert prose-sm max-w-none h-full overflow-y-auto max-h-[600px] scrollbar-hide">
                      <ReactMarkdown>{result.strategy}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trending Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#00FF00] mb-6 flex items-center gap-2">
              <TrendingUp size={14} /> Viral Trends
            </h3>
            
            <div className="space-y-3">
              {loadingTrends ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                ))
              ) : (
                trendingTopics.map((trend, idx) => (
                  <button
                    key={idx}
                    onClick={() => generateMeme(trend)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 border border-transparent hover:border-[#00FF00]/30 hover:bg-[#00FF00]/5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-white/30">0{idx + 1}</span>
                      <Zap size={10} className="text-[#00FF00] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm font-medium truncate group-hover:text-[#00FF00] transition-colors">{trend}</p>
                  </button>
                ))
              )}
            </div>

            <button 
              onClick={fetchTrendingTopics}
              className="w-full mt-6 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Info size={12} /> Refresh Trends
            </button>
          </div>

          {!isPremium && (
            <div className="bg-gradient-to-br from-[#00FF00]/20 to-transparent border border-[#00FF00]/30 p-6 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Crown size={16} className="text-[#00FF00]" /> Upgrade to PRO Mode
              </h4>
              <p className="text-[10px] text-white/60 leading-relaxed">
                Get HD Quality (FLUX.1), No Watermark, and 24/7 Global Trends.
              </p>
              
              {/* PayPal Button Integration */}
              <div className="pt-2">
                <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" className="flex justify-center">
                  <input type="hidden" name="cmd" value="_s-xclick" />
                  <input type="hidden" name="hosted_button_id" value="YOUR_PAYPAL_ID" />
                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#00FF00] text-black text-[10px] font-black uppercase rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} /> Subscribe via PayPal
                  </button>
                </form>
              </div>

              <button 
                onClick={() => setIsPremium(true)}
                className="w-full py-2 border border-white/10 text-white/40 text-[8px] uppercase tracking-widest rounded-lg hover:text-white transition-colors"
              >
                Simulate Pro Activation (Dev Only)
              </button>
            </div>
          )}
        </aside>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 p-12 text-center space-y-4">
        <div className="flex justify-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all">
          <span className="font-black italic tracking-tighter text-xl">TIKTOK</span>
          <span className="font-black italic tracking-tighter text-xl">REDDIT</span>
          <span className="font-black italic tracking-tighter text-xl">X.COM</span>
          <span className="font-black italic tracking-tighter text-xl">INSTAGRAM</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">
          Built for Global Virality &copy; 2026 Meme-X OS
        </p>
      </footer>
    </div>
  );
}
