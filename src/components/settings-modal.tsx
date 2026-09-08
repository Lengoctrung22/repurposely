"use client";

import { useState, useEffect } from "react";
import { X, Key, Check, AlertCircle, Loader2, Sparkles, ExternalLink, Shield } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySaved?: (key: string) => void;
}

export function SettingsModal({ isOpen, onClose, onApiKeySaved }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("repurposely_gemini_api_key") || "";
      setApiKey(storedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("repurposely_gemini_api_key", apiKey.trim());
      setIsSaved(true);
      if (onApiKeySaved) onApiKeySaved(apiKey.trim());
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("repurposely_gemini_api_key");
      setApiKey("");
      setTestResult(null);
      if (onApiKeySaved) onApiKeySaved("");
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "Vui lòng nhập API Key trước khi kiểm tra" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test quick call via Google GenAI or generate route
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey.trim());
      if (res.ok) {
        setTestResult({
          success: true,
          message: "API Key hợp lệ! Đã kết nối thành công tới Google Gemini 2.0.",
        });
        localStorage.setItem("repurposely_gemini_api_key", apiKey.trim());
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: `Lỗi xác thực: ${data.error?.message || "Mã khóa không hợp lệ hoặc đã hết hạn"}`,
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Không thể kết nối tới Google Gemini. Vui lòng kiểm tra kết nối mạng.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cấu Hình Google Gemini API Key
              </h3>
              <p className="text-xs text-slate-500">
                Tự do sử dụng API Key cá nhân của bạn ngay trên trình duyệt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gemini API Key:
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Lấy key miễn phí tại AI Studio</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              {testResult.success ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Info Notes */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4 text-[11px] text-slate-600 dark:text-slate-400 space-y-2 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>Bảo mật & Quyền riêng tư:</span>
            </div>
            <p>
              • Khóa API được lưu trữ cục bộ trong trình duyệt của bạn (LocalStorage) và chỉ được gửi kèm khi bạn yêu cầu tạo nội dung.
            </p>
            <p>
              • Nếu không nhập API Key, hệ thống sẽ sử dụng <strong>Intelligent Content Synthesizer (Demo Mode)</strong> để tạo bài đăng phân tích tự động mà không tốn phí.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-rose-600 hover:underline"
          >
            Xóa cấu hình
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting || !apiKey.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span>Kiểm tra kết nối</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              {isSaved ? <Check className="h-3.5 w-3.5" /> : null}
              <span>{isSaved ? "Đã lưu!" : "Lưu cài đặt"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
