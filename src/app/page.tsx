"use client";

import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles, Send, Loader2, Info, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [shouldGeneratePreview, setShouldGeneratePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!prompt && !image) return;

    setIsAnalyzing(true);
    setAnalysis("");
    setPreviewImage(null);

    const runAnalysis = async () => {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, image }),
        });

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setAnalysis((prev) => prev + chunk);
        }
      } catch (error) {
        console.error("Analysis failed:", error);
        setAnalysis("解析中にエラーが発生しました。");
      } finally {
        setIsAnalyzing(false);
      }
    };

    const runGeneration = async () => {
      if (!shouldGeneratePreview) return;
      setIsGenerating(true);
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        setPreviewImage(data.imageUrl);
      } catch (error) {
        console.error("Generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    await Promise.all([runAnalysis(), runGeneration()]);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="text-center space-y-2 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          SD Prompt <span className="gradient-text">Analyzer</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          xAI (Grok) の高度な推論によるStable Diffusionプロンプト解析・デバッグツール
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass rounded-3xl p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Send size={16} /> Stable Diffusion プロンプト
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="masterpiece, best quality, girl with blue eyes..."
                className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ImageIcon size={16} /> 参考画像 (Optional - Vision解析用)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed border-white/10 rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all relative overflow-hidden",
                  image && "border-blue-500/50"
                )}
              >
                {image ? (
                  <>
                    <img src={image} alt="Uploaded" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setImage(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 text-white transition-all shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <Upload className="mx-auto text-zinc-500" />
                    <p className="text-zinc-500 text-sm">画像をドラッグ＆ドロップまたはクリック</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 transition-all hover:border-white/10">
              <input
                type="checkbox"
                id="gen-preview"
                checked={shouldGeneratePreview}
                onChange={(e) => setShouldGeneratePreview(e.target.checked)}
                className="w-5 h-5 rounded-md accent-blue-500 cursor-pointer"
              />
              <label htmlFor="gen-preview" className="text-sm text-zinc-300 cursor-pointer select-none">
                解析と同時にプレビュー画像を生成する
              </label>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!prompt && !image)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/20"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isAnalyzing ? "解析中..." : "解析と診断を開始"}
            </button>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {(analysis || isAnalyzing) ? (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-3xl p-6 md:p-8 min-h-[500px] relative overflow-hidden"
              >
                {isAnalyzing && !analysis && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10 rounded-3xl">
                    <div className="text-center space-y-4">
                      <Loader2 className="animate-spin mx-auto text-blue-500" size={40} />
                      <p className="text-zinc-400 font-medium animate-pulse">Grok が思考しています...</p>
                    </div>
                  </div>
                )}

                <div className="prose prose-invert prose-blue max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysis}
                  </ReactMarkdown>
                </div>
              </motion.section>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-3xl opacity-50 space-y-4">
                <Info size={48} className="text-zinc-600" />
                <p className="text-zinc-500">プロンプトを入力して解析を開始してください</p>
              </div>
            )}
          </AnimatePresence>

          {/* Preview Image Section */}
          <AnimatePresence>
            {(previewImage || isGenerating) && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-4 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-500" /> 生成プレビュー
                  </h3>
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                      <Loader2 size={12} className="animate-spin" /> 生成中...
                    </div>
                  )}
                </div>
                <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden relative">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                      <Sparkles size={48} className="text-blue-500/20" />
                    </div>
                  )}
                </div>
                {previewImage && (
                  <p className="text-[10px] text-zinc-500 mt-2 text-center italic">
                    ※外部API連携前のプレースホルダー画像です
                  </p>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
