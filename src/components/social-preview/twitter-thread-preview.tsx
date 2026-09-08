"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Check,
  Copy,
  Edit3,
  Eye,
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  Share,
  Plus,
  Trash2,
  Download,
} from "lucide-react";

export interface TweetItem {
  tweetNumber: number;
  content: string;
}

interface TwitterThreadPreviewProps {
  initialTweets: TweetItem[];
  authorName?: string;
  authorHandle?: string;
}

export function TwitterThreadPreview({
  initialTweets,
  authorName = "Nguyen Van A",
  authorHandle = "nguyenvana_ai",
}: TwitterThreadPreviewProps) {
  const [tweets, setTweets] = useState<TweetItem[]>(initialTweets);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Synchronize with external changes
  useEffect(() => {
    setTweets(initialTweets);
    setEditingIndex(null);
  }, [initialTweets]);

  // Generate stable random engagement stats to avoid hydration mismatch
  const engagementStats = useMemo(
    () =>
      initialTweets.map(() => ({
        comments: Math.floor(Math.random() * 15) + 3,
        reposts: Math.floor(Math.random() * 30) + 8,
        likes: Math.floor(Math.random() * 120) + 25,
        bookmarks: Math.floor(Math.random() * 45) + 5,
      })),
    [initialTweets]
  );

  const handleUpdateTweet = (index: number, newText: string) => {
    const updated = [...tweets];
    updated[index] = { ...updated[index], content: newText };
    setTweets(updated);
  };

  const handleAddTweet = () => {
    const nextNumber = tweets.length + 1;
    const newTweet: TweetItem = {
      tweetNumber: nextNumber,
      content: `${nextNumber}/ Nhập nội dung cho tweet tiếp theo...`,
    };
    setTweets([...tweets, newTweet]);
    setEditingIndex(tweets.length);
  };

  const handleDeleteTweet = (index: number) => {
    if (tweets.length <= 1) return;
    const updated = tweets
      .filter((_, i) => i !== index)
      .map((t, i) => ({
        ...t,
        tweetNumber: i + 1,
        // Cập nhật số thứ tự nếu tweet bắt đầu bằng "N/"
        content: t.content.replace(/^[0-9]+\//, `${i + 1}/`),
      }));
    setTweets(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const fullThreadText = tweets.map((t) => t.content).join("\n\n---\n\n");

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullThreadText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error("Lỗi copy thread:", err);
    }
  };

  const handleCopySingle = async (index: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Lỗi copy tweet:", err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([fullThreadText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `twitter-thread-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900 transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white font-bold text-xs dark:bg-white dark:text-black">
            𝕏
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            X (Twitter) Thread
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {tweets.length} Tweets
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Tải về file chuỗi tweet (.txt)"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleCopyAll}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              copiedAll
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                : "bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 shadow-sm"
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Đã sao chép cả Thread!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép Thread</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tweets List with Connected Thread Line */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {tweets.map((tweet, idx) => {
          const isLast = idx === tweets.length - 1;
          const isBeingEdited = editingIndex === idx;
          const charCount = tweet.content.length;
          const isOverLimit = charCount > 280;

          return (
            <div
              key={idx}
              className="relative p-5 group hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors"
            >
              {/* Vertical Thread Connector Line */}
              {!isLast && (
                <div className="absolute left-[38px] top-[60px] bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
              )}

              <div className="flex items-start gap-3 relative z-10">
                {/* User Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-xs ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900">
                  {authorName.charAt(0)}
                </div>

                {/* Tweet Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {authorName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        @{authorHandle}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {tweet.tweetNumber}/{tweets.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingIndex(isBeingEdited ? null : idx)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                        title={isBeingEdited ? "Xem trước" : "Sửa tweet này"}
                      >
                        {isBeingEdited ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                      </button>

                      {tweets.length > 1 && (
                        <button
                          onClick={() => handleDeleteTweet(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/30"
                          title="Xóa tweet này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopySingle(idx, tweet.content)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Sao chép tweet này"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedIndex === idx ? "Xong" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body text / Edit input */}
                  {isBeingEdited ? (
                    <div className="mt-2 space-y-1.5">
                      <textarea
                        value={tweet.content}
                        onChange={(e) => handleUpdateTweet(idx, e.target.value)}
                        rows={3}
                        className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 leading-relaxed dark:bg-slate-950 ${
                          isOverLimit
                            ? "border-red-400 focus:ring-red-400/20 text-red-700 dark:text-red-400"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {isOverLimit ? "⚠️ Vượt quá giới hạn của X (Twitter)" : "Độ dài tiêu chuẩn"}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isOverLimit ? "text-red-500 font-bold" : "text-slate-400"
                          }`}
                        >
                          {charCount} / 280 ký tự
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {tweet.content}
                    </p>
                  )}

                  {/* Simulated Tweet Action Bar */}
                  <div className="flex items-center justify-between mt-3 text-slate-400 max-w-sm text-xs">
                    <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{engagementStats[idx]?.comments ?? 5}</span>
                    </span>
                    <span className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer transition-colors">
                      <Repeat className="h-3.5 w-3.5" />
                      <span>{engagementStats[idx]?.reposts ?? 12}</span>
                    </span>
                    <span className="flex items-center gap-1 hover:text-rose-500 cursor-pointer transition-colors">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{engagementStats[idx]?.likes ?? 42}</span>
                    </span>
                    <span className="flex items-center gap-1 hover:text-blue-500 cursor-pointer transition-colors">
                      <Bookmark className="h-3.5 w-3.5" />
                      <span>{engagementStats[idx]?.bookmarks ?? 8}</span>
                    </span>
                    <span className="flex items-center gap-1 hover:text-slate-600 cursor-pointer transition-colors">
                      <Share className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Tweet Button */}
      <div className="p-3 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={handleAddTweet}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-all"
        >
          <Plus className="h-4 w-4 text-blue-600" />
          <span>Thêm tweet mới vào Thread ({tweets.length + 1}/{tweets.length + 1})</span>
        </button>
      </div>
    </div>
  );
}
