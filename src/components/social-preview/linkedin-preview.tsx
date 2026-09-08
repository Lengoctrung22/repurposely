"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Copy,
  Edit3,
  Eye,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  Globe,
  Download,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";

interface LinkedInPreviewProps {
  initialContent: string;
  hashtags?: string[];
  authorName?: string;
  authorHeadline?: string;
}

export function LinkedInPreview({
  initialContent,
  hashtags = [],
  authorName = "Nguyễn Văn A",
  authorHeadline = "Founder & Content Strategist • AI & Tech Enthusiast",
}: LinkedInPreviewProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Synchronize when initialContent updates externally
  useEffect(() => {
    setContent(initialContent);
    setIsExpanded(false);
  }, [initialContent]);

  const fullTextToCopy = `${content}\n\n${hashtags.join(" ")}`;
  const charCount = fullTextToCopy.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullTextToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Không thể copy:", err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([fullTextToCopy], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `linkedin-post-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  // Truncation simulation: LinkedIn truncates roughly after 3-4 lines (~200 chars)
  const lines = content.split("\n");
  const shouldTruncate = lines.length > 5 || content.length > 280;
  const displayContent = !isExpanded && shouldTruncate
    ? lines.slice(0, 4).join("\n")
    : content;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900 transition-all">
      {/* Card Header & Controls */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a66c2] text-white font-bold text-xs">
            in
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            LinkedIn Post Preview
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
            {charCount} ký tự
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 transition-colors"
          >
            {isEditing ? (
              <>
                <Eye className="h-3.5 w-3.5 text-blue-500" />
                <span>Xem trước</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                <span>Chỉnh sửa</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Tải về file văn bản (.txt)"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              copied
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép Post</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LinkedIn Post Body Container */}
      <div className="p-5">
        {/* Author Details */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-semibold text-base shadow-sm">
              {authorName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 truncate dark:text-white">
                  {authorName}
                </h4>
                <span className="text-[11px] text-slate-400">• 1st</span>
              </div>
              <p className="text-xs text-slate-500 truncate dark:text-slate-400">
                {authorHeadline}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <span>Vừa xong</span>
                <span>•</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm font-normal text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 leading-relaxed"
              placeholder="Nhập hoặc chỉnh sửa nội dung bài đăng..."
            />
          </div>
        ) : (
          <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-normal">
            {displayContent}

            {/* Truncated "see more" button */}
            {!isExpanded && shouldTruncate && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-slate-500 hover:text-[#0a66c2] font-semibold text-xs ml-1 inline-flex items-center"
              >
                ...xem thêm
              </button>
            )}

            {/* Hashtags Section */}
            {hashtags && hashtags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 font-semibold text-xs text-[#0a66c2] dark:text-blue-400">
                {hashtags.map((tag, idx) => (
                  <span key={idx} className="hover:underline cursor-pointer">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulated Reactions & Engagement */}
      <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="flex -space-x-1">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[9px]">
              👍
            </span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px]">
              ❤️
            </span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[9px]">
              💡
            </span>
          </span>
          <span>142 lượt tương tác</span>
        </div>
        <div className="flex items-center gap-3">
          <span>28 bình luận</span>
          <span>•</span>
          <span>15 lượt chia sẻ</span>
        </div>
      </div>

      {/* Simulated Action Bar */}
      <div className="grid grid-cols-4 border-t border-slate-100 py-1 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/20">
        <button className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100/80 rounded-lg mx-1 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
          <ThumbsUp className="h-4 w-4" />
          <span className="hidden sm:inline">Thích</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100/80 rounded-lg mx-1 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Bình luận</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100/80 rounded-lg mx-1 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
          <Repeat2 className="h-4 w-4" />
          <span className="hidden sm:inline">Đăng lại</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100/80 rounded-lg mx-1 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Gửi</span>
        </button>
      </div>
    </div>
  );
}
