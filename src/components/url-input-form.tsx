"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  FileText,
  Sparkles,
  Loader2,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Key,
  Info,
} from "lucide-react";
import { YoutubeIcon } from "@/components/icons";
import { GeneratedSocialContent } from "@/lib/gemini";
import { SettingsModal } from "@/components/settings-modal";

interface UrlInputFormProps {
  onGenerated: (
    data: GeneratedSocialContent,
    meta: { title: string; sourceType: string; sourceUrl: string; jobId?: string | null }
  ) => void;
}

export function UrlInputForm({ onGenerated }: UrlInputFormProps) {
  const [activeTab, setActiveTab] = useState<"youtube" | "article" | "raw_text">("youtube");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [tone, setTone] = useState<"professional" | "viral" | "storyteller" | "educator">("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  // Trạng thái trích xuất & sinh nội dung
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    title: string;
    content: string;
    wordCount: number;
    hasCaptions?: boolean;
    sourceType: "youtube" | "article" | "raw_text";
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = localStorage.getItem("repurposely_gemini_api_key");
      setHasCustomKey(Boolean(key && key.trim().length > 0));
    }
  }, []);

  // Mẫu demo nhanh cho người dùng thử nghiệm tức thì
  const sampleYoutubeUrl = "https://www.youtube.com/watch?v=UF8uR6Z6KLc";
  const sampleArticleUrl = "https://nextjs.org/blog/next-15";

  const handleExtract = async () => {
    setErrorMessage(null);
    if (activeTab === "raw_text") {
      if (!rawText.trim()) {
        setErrorMessage("Vui lòng nhập văn bản cần xử lý");
        return;
      }
      setExtractedData({
        title: rawText.slice(0, 50).trim() + "...",
        content: rawText,
        wordCount: rawText.split(/\s+/).length,
        sourceType: "raw_text",
      });
      return;
    }

    if (!url.trim()) {
      setErrorMessage("Vui lòng nhập đường dẫn URL hợp lệ");
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể trích xuất nội dung từ đường dẫn này");
      }

      setExtractedData({
        title: data.title,
        content: data.content,
        wordCount: data.wordCount,
        hasCaptions: data.hasCaptions,
        sourceType: data.sourceType,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi trích xuất";
      setErrorMessage(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    let currentExtracted = extractedData;

    if (!currentExtracted) {
      if (activeTab === "raw_text") {
        if (!rawText.trim()) {
          setErrorMessage("Vui lòng nhập văn bản trước khi tạo.");
          return;
        }
        currentExtracted = {
          title: rawText.slice(0, 50).trim() + "...",
          content: rawText,
          wordCount: rawText.split(/\s+/).length,
          sourceType: "raw_text",
        };
        setExtractedData(currentExtracted);
      } else {
        if (!url.trim()) {
          setErrorMessage("Vui lòng nhập URL trước khi tạo.");
          return;
        }
        setIsExtracting(true);
        try {
          const res = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url.trim() }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Không thể trích xuất nội dung từ URL");
          }
          currentExtracted = {
            title: data.title,
            content: data.content,
            wordCount: data.wordCount,
            hasCaptions: data.hasCaptions,
            sourceType: data.sourceType,
          };
          setExtractedData(currentExtracted);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Lỗi trích xuất";
          setErrorMessage(msg);
          setIsExtracting(false);
          return;
        } finally {
          setIsExtracting(false);
        }
      }
    }

    if (!currentExtracted?.content) {
      setErrorMessage("Chưa có nội dung để sinh bài viết.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const clientApiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("repurposely_gemini_api_key") || ""
          : "";

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(clientApiKey ? { "x-gemini-api-key": clientApiKey } : {}),
        },
        body: JSON.stringify({
          title: currentExtracted.title,
          content: currentExtracted.content,
          sourceType: currentExtracted.sourceType,
          sourceUrl: url,
          tone,
          customInstructions,
          apiKey: clientApiKey,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Không thể sinh bài viết từ AI");
      }

      onGenerated(result.data, {
        title: currentExtracted.title,
        sourceType: currentExtracted.sourceType,
        sourceUrl: url,
        jobId: result.jobId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi sinh bài viết";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
        {/* Top bar with API Key quick indicator */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nguồn dữ liệu đầu vào
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              hasCustomKey
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <Key className="h-3 w-3 text-blue-500" />
            <span>{hasCustomKey ? "Gemini Key: Đã kết nối" : "Cấu hình Gemini Key"}</span>
          </button>
        </div>

        {/* Tabs Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl dark:bg-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("youtube");
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "youtube"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <YoutubeIcon className={`h-4 w-4 ${activeTab === "youtube" ? "text-red-600" : ""}`} />
            <span>YouTube Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("article");
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "article"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Globe className={`h-4 w-4 ${activeTab === "article" ? "text-blue-600" : ""}`} />
            <span>Blog / Website</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("raw_text");
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "raw_text"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FileText className={`h-4 w-4 ${activeTab === "raw_text" ? "text-indigo-600" : ""}`} />
            <span>Dán văn bản thô</span>
          </button>
        </div>

        {/* Input Fields */}
        {activeTab === "raw_text" ? (
          <div className="space-y-2 mb-6">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nội dung bài viết / Ghi chú của bạn:
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={5}
              placeholder="Dán nội dung bất kỳ bạn muốn chuyển thành bài đăng LinkedIn, Twitter thread & Email newsletter..."
              className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {activeTab === "youtube" ? "Đường dẫn Video YouTube:" : "Đường dẫn bài viết Blog:"}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Thử mẫu:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUrl(activeTab === "youtube" ? sampleYoutubeUrl : sampleArticleUrl);
                    setErrorMessage(null);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  {activeTab === "youtube" ? "Steve Jobs Speech" : "Next.js 15 Blog"}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={
                    activeTab === "youtube"
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://example.com/bai-viet..."
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || !url.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-all shadow-sm shrink-0"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang trích xuất...</span>
                  </>
                ) : (
                  <>
                    <span>Bóc tách nội dung</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Extracted Status Banner */}
        {extractedData && (
          <div className="mb-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 truncate">
                    {extractedData.title}
                  </h4>
                  {extractedData.hasCaptions !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        extractedData.hasCaptions
                          ? "bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300"
                      }`}
                    >
                      {extractedData.hasCaptions ? "Full Captions/Subtitles" : "Video Metadata & Notes"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Đã trích xuất thành công {extractedData.wordCount.toLocaleString()} từ. Sẵn sàng đưa vào Gemini Flash Engine!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tone & Style Selection */}
        <div className="space-y-3 mb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              <span>Chọn phong cách / Giọng điệu (Tone of Voice):</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "professional", label: "🎯 Chuyên nghiệp", desc: "Insight sâu sắc, uy tín" },
              { id: "viral", label: "🚀 Viral & Cuốn hút", desc: "Hook mạnh, tương tác cao" },
              { id: "storyteller", label: "📖 Kể chuyện", desc: "Tự nhiên, lôi cuốn" },
              { id: "educator", label: "💡 Giáo dục thực chiến", desc: "Dễ hiểu, từng bước" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTone(item.id as typeof tone)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  tone === item.id
                    ? "border-blue-600 bg-blue-50/70 text-blue-950 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Custom Instructions */}
        <div className="space-y-1.5 mb-6">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <span>Yêu cầu bổ sung cho AI (Tùy chọn):</span>
          </label>
          <input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ví dụ: Tập trung vào lập trình viên Next.js, nhấn mạnh các số liệu thực tế..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        {/* Main Action Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || isExtracting || (!url && !rawText && !extractedData)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 disabled:opacity-50 shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Gemini AI đang sinh LinkedIn, Twitter Thread & Newsletter...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>Tạo nội dung đa kênh ngay</span>
            </>
          )}
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySaved={(key) => setHasCustomKey(Boolean(key && key.trim()))}
      />
    </>
  );
}
