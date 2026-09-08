"use client";

import { useState } from "react";
import {
  Mail,
  Check,
  Copy,
  Edit3,
  Eye,
  Download,
  Send,
  Sparkles,
  Inbox,
  Clock,
  User,
} from "lucide-react";

export interface NewsletterData {
  subject: string;
  previewText: string;
  content: string;
}

interface NewsletterPreviewProps {
  initialNewsletter?: NewsletterData;
  authorName?: string;
  authorEmail?: string;
}

const DEFAULT_NEWSLETTER: NewsletterData = {
  subject: "[Deep-Dive] Công thức biến 1 Video thành 5 bài đăng viral",
  previewText: "Tối ưu hóa thời gian phân phối nội dung và tăng 5x tương tác trên mạng xã hội.",
  content: `Xin chào bạn,

Hôm nay tôi muốn chia sẻ với bạn một tư duy cốt lõi trong việc xây dựng thương hiệu cá nhân và phân phối nội dung:

"Đừng làm nhiều hơn, hãy phân phối thông minh hơn."

---

🎯 TẠI SAO BẠN NÊN QUAN TÂM?
Rất nhiều chuyên gia và lập trình viên dành 10-20 tiếng để tạo ra một sản phẩm thông tin tuyệt vời (video hoặc bài blog chuyên sâu), nhưng sau đó chỉ đăng một lần duy nhất.
Kết quả là 80% khán giả mục tiêu chưa từng được tiếp cận giá trị của bạn.

📌 3 ĐIỂM CỐT LÕI CẦN GHI NHỚ:
1. Mỗi video dài luôn chứa ít nhất 3-5 góc nhìn độc lập có thể tách thành các bài đăng riêng lẻ.
2. LinkedIn ưu tiên các bài học thực chiến, số liệu và câu hỏi thảo luận mở.
3. Twitter (X) ưu tiên sự cô đọng, hook ngắn và punchline rõ ràng.

💡 HÀNH ĐỘNG CHO BẠN:
Hãy mở lại bài viết hoặc video tốt nhất của bạn trong 3 tháng qua, bóc tách ra 1 bài học tâm đắc nhất và chia sẻ lại trên LinkedIn ngay hôm nay!

Chúc bạn có một tuần làm việc hiệu quả và nhiều đột phá!

Thân ái,
Đội ngũ Repurposely AI`,
};

export function NewsletterPreview({
  initialNewsletter,
  authorName = "Nguyen Van A",
  authorEmail = "newsletter@repurposely.ai",
}: NewsletterPreviewProps) {
  const [newsletter, setNewsletter] = useState<NewsletterData>(
    initialNewsletter || DEFAULT_NEWSLETTER
  );
  const [isEditing, setIsEditing] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  // Sync if initialNewsletter changes
  if (initialNewsletter && initialNewsletter.subject !== newsletter.subject && !isEditing) {
    setNewsletter(initialNewsletter);
  }

  const fullMarkdown = `# ${newsletter.subject}\n\n*${newsletter.previewText}*\n\n${newsletter.content}`;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullMarkdown);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error("Lỗi copy newsletter:", err);
    }
  };

  const handleCopySubject = async () => {
    try {
      await navigator.clipboard.writeText(newsletter.subject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } catch (err) {
      console.error("Lỗi copy subject:", err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([fullMarkdown], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `newsletter-${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900 transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-600 text-white font-bold text-xs">
            <Mail className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Email Newsletter Digest
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
            Broadcast
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
            title="Tải về file Markdown (.md)"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleCopyAll}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              copiedAll
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20"
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulated Email Client Envelope */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20 space-y-3">
        {/* Subject Line Field */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Tiêu đề thư (Subject Line)
            </span>
            {isEditing ? (
              <input
                type="text"
                value={newsletter.subject}
                onChange={(e) => setNewsletter({ ...newsletter, subject: e.target.value })}
                className="w-full text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            ) : (
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {newsletter.subject}
              </h3>
            )}
          </div>

          <button
            onClick={handleCopySubject}
            className="p-1 rounded text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-purple-400 dark:hover:bg-purple-950/40 transition-colors shrink-0 mt-3"
            title="Sao chép tiêu đề"
          >
            {copiedSubject ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Preview text */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Đoạn xem trước (Preview Snippet)
          </span>
          {isEditing ? (
            <input
              type="text"
              value={newsletter.previewText}
              onChange={(e) => setNewsletter({ ...newsletter, previewText: e.target.value })}
              className="w-full text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              {newsletter.previewText}
            </p>
          )}
        </div>

        {/* Sender details */}
        <div className="flex items-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-purple-600" />
            <span>Từ: <strong>{authorName}</strong> &lt;{authorEmail}&gt;</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <Clock className="h-3 w-3" />
            <span>Hôm nay, 09:00 AM</span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={newsletter.content}
              onChange={(e) => setNewsletter({ ...newsletter, content: e.target.value })}
              rows={14}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm font-normal text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 leading-relaxed font-mono text-xs"
              placeholder="Nhập nội dung email..."
            />
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed text-sm">
            {newsletter.content}
          </div>
        )}
      </div>

      {/* Footer simulation */}
      <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between text-[11px] text-slate-400">
        <span>Định dạng tương thích với Substack, Mailchimp, Beehiiv, ConvertKit</span>
        <div className="flex items-center gap-2">
          <span className="hover:underline cursor-pointer">Hủy đăng ký (Unsubscribe)</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Xem trên trình duyệt</span>
        </div>
      </div>
    </div>
  );
}
