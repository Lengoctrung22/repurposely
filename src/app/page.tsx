"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { UrlInputForm } from "@/components/url-input-form";
import { LinkedInPreview } from "@/components/social-preview/linkedin-preview";
import { TwitterThreadPreview } from "@/components/social-preview/twitter-thread-preview";
import { NewsletterPreview } from "@/components/social-preview/newsletter-preview";
import { KeyTakeaways } from "@/components/key-takeaways";
import { GeneratedSocialContent } from "@/lib/gemini";
import {
  Sparkles,
  Share2,
  Database,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  FileText,
  Mail,
  X,
  History,
} from "lucide-react";
import { YoutubeIcon } from "@/components/icons";

const INITIAL_DEMO_DATA: GeneratedSocialContent = {
  keyTakeaways: [
    "Một video YouTube dài 20 phút chứa ít nhất 5 góc nhìn có thể khai thác thành các bài post viral",
    "LinkedIn ưu tiên các bài học thực chiến kèm số liệu, trong khi Twitter (X) ưu tiên sự súc tích và punchline",
    "Tái chế nội dung (Repurposing) giúp tăng tần suất phủ sóng thương hiệu gấp 5 lần mà không tốn thêm công sức",
    "Email Newsletter là kênh sở hữu trực tiếp (owned media) giữ chân khán giả trung thành hiệu quả nhất",
  ],
  linkedinPost: {
    hook: "🚀 Đừng để 10 tiếng làm video của bạn kết thúc chỉ bằng 1 lần bấm nút 'Đăng'!",
    content: `🚀 Đừng để 10 tiếng làm video của bạn kết thúc chỉ bằng 1 lần bấm nút 'Đăng'!

Rất nhiều nhà sáng tạo nội dung và lập trình viên mắc phải sai lầm này:
Họ dồn toàn bộ tâm huyết vào 1 video YouTube hoặc 1 bài blog kỹ thuật... rồi dừng lại ở đó.

Sự thật là: Khán giả trên LinkedIn có thể chưa từng biết đến kênh YouTube của bạn!

Dưới đây là công thức 3 bước tôi dùng để nhân bản giá trị thông điệp:

💡 1. Rút trích 'Key Takeaways' cốt lõi: Thay vì tóm tắt sơ sài, hãy tập trung vào bài học có thể hành động ngay.
💡 2. Định dạng lại cấu trúc đọc: Viết câu ngắn, sử dụng khoảng trắng nhiều hơn để tối ưu trải nghiệm đọc trên điện thoại.
💡 3. Kết thúc bằng câu hỏi mở: Kích thích sự chia sẻ và bàn luận chuyên sâu từ cộng đồng.

Bạn đã từng thử biến 1 video cũ thành bài viết LinkedIn chưa? Kết quả thế nào? Cùng chia sẻ bên dưới nhé! 👇`,
    hashtags: ["#ContentRepurposing", "#SaaS", "#PersonalBranding", "#GrowthHacking", "#GeminiAI"],
  },
  twitterThread: [
    {
      tweetNumber: 1,
      content:
        "1/ Bạn đang lãng phí 80% giá trị nội dung nếu chỉ xuất bản nó một lần duy nhất.\n\nĐây là cách biến 1 video YouTube thành 5 bài viết giá trị cao trên X & LinkedIn (Thread chi tiết): 🧵👇",
    },
    {
      tweetNumber: 2,
      content:
        "2/ Quy tắc 1: 'Khán giả khác nhau ở những sân chơi khác nhau'.\n\nNgười thích xem YouTube chưa chắc đã lướt X. Người theo dõi bạn trên X có thể chưa từng ghé thăm blog của bạn. Hãy mang giá trị đến tận nơi họ xuất hiện.",
    },
    {
      tweetNumber: 3,
      content:
        "3/ Quy tắc 2: 'Ngắt nhỏ chiếc bánh lớn'.\n\nMột video 15 phút thường gồm: 1 luận điểm chính, 3 dẫn chứng và 1 kết luận. Mỗi dẫn chứng đó là 1 tweet độc lập có thể nhận hàng chục repost nếu biết cách đóng gói.",
    },
    {
      tweetNumber: 4,
      content:
        "4/ Quy tắc 3: 'Tối ưu cho sự chú ý 3 giây đầu'.\n\nTweet đầu tiên luôn phải là một lời hứa hẹn giá trị rõ ràng hoặc phá vỡ định kiến quen thuộc. Đừng mở đầu bằng lời chào lan man.",
    },
    {
      tweetNumber: 5,
      content:
        "5/ Tóm lại: Sáng tạo nội dung không phải là làm nhiều hơn, mà là phân phối thông minh hơn.\n\nNếu bài viết này mở ra góc nhìn mới cho bạn, hãy Bookmark và Repost tweet 1 nhé! 🔄",
    },
  ],
  newsletter: {
    subject: "[Deep-Dive] Công thức biến 1 Video thành chuỗi bài đăng đa nền tảng",
    previewText: "Tối ưu hóa thời gian phân phối nội dung và tăng 5x tương tác trên mạng xã hội.",
    content: `Xin chào bạn,

Hôm nay tôi muốn chia sẻ với bạn một tư duy cốt lõi trong việc xây dựng thương hiệu cá nhân và phân phối nội dung:

"Đừng làm nhiều hơn, hãy phân phối thông minh hơn."

---

🎯 TẠI SAO BẠN NÊN QUAN TÂM?
Rất nhiều chuyên gia và lập trình viên dành 10-20 tiếng để tạo ra một sản phẩm thông tin tuyệt vời, nhưng sau đó chỉ đăng một lần duy nhất. Kết quả là 80% khán giả mục tiêu chưa từng được tiếp cận giá trị của bạn.

📌 3 ĐIỂM CỐT LÕI CẦN GHI NHỚ:
1. Mỗi video dài luôn chứa ít nhất 3-5 góc nhìn độc lập có thể tách thành các bài đăng riêng lẻ.
2. LinkedIn ưu tiên các bài học thực chiến, số liệu và câu hỏi thảo luận mở.
3. Twitter (X) ưu tiên sự cô đọng, hook ngắn và punchline rõ ràng.

💡 HÀNH ĐỘNG CHO BẠN:
Hãy mở lại bài viết hoặc video tốt nhất của bạn trong 3 tháng qua, bóc tách ra 1 bài học tâm đắc nhất và chia sẻ lại trên LinkedIn ngay hôm nay!

Chúc bạn có một tuần làm việc hiệu quả và nhiều đột phá!

Thân ái,
Đội ngũ Repurposely AI`,
  },
};

export default function HomePage() {
  const [contentData, setContentData] = useState<GeneratedSocialContent>(INITIAL_DEMO_DATA);
  const [activePreviewTab, setActivePreviewTab] = useState<"all" | "linkedin" | "twitter" | "newsletter">("all");
  const [currentMeta, setCurrentMeta] = useState({
    title: "Chiến lược Tái chế Nội dung (Repurposing)",
    sourceType: "youtube",
    sourceUrl: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    jobId: null as string | null,
  });

  const [toast, setToast] = useState<{ show: boolean; message: string; jobId?: string | null }>({
    show: false,
    message: "",
    jobId: null,
  });

  // Tải job từ URL query nếu có (ví dụ khi user bấm "Mở trong Trình tạo" từ Dashboard)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const jobId = params.get("jobId");
      if (jobId) {
        fetch(`/api/jobs/${jobId}`)
          .then((res) => res.json())
          .then((res) => {
            if (res.success && res.job) {
              const j = res.job;
              setContentData({
                keyTakeaways: j.keyTakeaways || [],
                linkedinPost: j.linkedinPost,
                twitterThread: j.twitterThread || [],
                newsletter: j.newsletter,
              });
              setCurrentMeta({
                title: j.sourceTitle,
                sourceType: j.sourceType,
                sourceUrl: j.sourceUrl || "",
                jobId: j._id,
              });
              setToast({
                show: true,
                message: `Đã nạp bài viết "${j.sourceTitle}" vào trình chỉnh sửa.`,
                jobId: j._id,
              });
            }
          })
          .catch((err) => console.error("Lỗi tải job:", err));
      }
    }
  }, []);

  const handleGenerated = (
    data: GeneratedSocialContent,
    meta: { title: string; sourceType: string; sourceUrl: string; jobId?: string | null }
  ) => {
    setContentData(data);
    setCurrentMeta({
      title: meta.title,
      sourceType: meta.sourceType,
      sourceUrl: meta.sourceUrl,
      jobId: meta.jobId || null,
    });

    setToast({
      show: true,
      message: meta.jobId
        ? "Đã lưu bản ghi thành công vào cơ sở dữ liệu MongoDB!"
        : "Đã sinh bài viết thành công!",
      jobId: meta.jobId || null,
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 9000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-[#090d16]">
      <Navbar />

      {/* Persistent Toast notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700/50 dark:border-slate-200 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 dark:text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold">{toast.message}</p>
            {toast.jobId && (
              <div className="mt-1 flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 font-bold text-blue-400 dark:text-blue-600 hover:underline"
                >
                  <Database className="h-3 w-3" />
                  <span>Xem trong Kho lưu trữ MongoDB</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gemini 2.5 Flash • Next.js 16 • MongoDB Compass Ready</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Biến 1 Video Hoặc Bài Viết Thành{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Chuỗi Post Viral Đa Kênh
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Dán đường dẫn YouTube hoặc bài viết blog bất kỳ. Hệ thống AI tự động bóc tách transcript, chắt lọc bài học cốt lõi và xuất bản cho <strong>LinkedIn</strong>, <strong>Twitter/X Thread</strong> và <strong>Email Newsletter</strong>.
          </p>
        </section>

        {/* Input Form Section */}
        <section className="max-w-4xl mx-auto">
          <UrlInputForm onGenerated={handleGenerated} />
        </section>

        {/* Current Content Banner */}
        <section className="max-w-4xl mx-auto flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/50 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {currentMeta.sourceType === "youtube" ? (
              <span className="flex items-center gap-1 text-red-600 font-semibold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md shrink-0">
                <YoutubeIcon className="h-3.5 w-3.5" />
                <span>YouTube</span>
              </span>
            ) : currentMeta.sourceType === "article" ? (
              <span className="flex items-center gap-1 text-blue-600 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md shrink-0">
                <Share2 className="h-3.5 w-3.5" />
                <span>Blog/Web</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md shrink-0">
                <FileText className="h-3.5 w-3.5" />
                <span>Văn bản</span>
              </span>
            )}

            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {currentMeta.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {currentMeta.sourceUrl && (
              <a
                href={currentMeta.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Mở link gốc"
              >
                <span>Nguồn gốc</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline dark:text-blue-400"
            >
              <History className="h-3 w-3" />
              <span>Xem lịch sử</span>
            </Link>
          </div>
        </section>

        {/* Key Takeaways Section */}
        {contentData.keyTakeaways && contentData.keyTakeaways.length > 0 && (
          <section className="max-w-4xl mx-auto">
            <KeyTakeaways takeaways={contentData.keyTakeaways} />
          </section>
        )}

        {/* Social Mockups & Live Previews */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <span>Giao diện xem trước đa nền tảng (Live Social Mockups)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chỉnh sửa trực tiếp, sao chép hoặc tải file chỉ với 1 cú click chuột
              </p>
            </div>

            {/* View Filter Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl dark:bg-slate-800/80 flex-wrap">
              <button
                onClick={() => setActivePreviewTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreviewTab === "all"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Tất cả định dạng
              </button>
              <button
                onClick={() => setActivePreviewTab("linkedin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreviewTab === "linkedin"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                LinkedIn
              </button>
              <button
                onClick={() => setActivePreviewTab("twitter")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreviewTab === "twitter"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Twitter Thread
              </button>
              <button
                onClick={() => setActivePreviewTab("newsletter")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreviewTab === "newsletter"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Newsletter
              </button>
            </div>
          </div>

          {/* Social Previews Grid */}
          <div
            className={`grid gap-6 ${
              activePreviewTab === "all"
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1 max-w-2xl mx-auto"
            }`}
          >
            {(activePreviewTab === "all" || activePreviewTab === "linkedin") && (
              <div className="space-y-3">
                <LinkedInPreview
                  initialContent={contentData.linkedinPost.content}
                  hashtags={contentData.linkedinPost.hashtags}
                />
              </div>
            )}

            {(activePreviewTab === "all" || activePreviewTab === "twitter") && (
              <div className="space-y-3">
                <TwitterThreadPreview initialTweets={contentData.twitterThread} />
              </div>
            )}

            {(activePreviewTab === "all" || activePreviewTab === "newsletter") && (
              <div className={activePreviewTab === "all" ? "lg:col-span-2 max-w-4xl mx-auto w-full" : ""}>
                <NewsletterPreview initialNewsletter={contentData.newsletter} />
              </div>
            )}
          </div>
        </section>

        {/* Feature Highlights / How it works */}
        <section className="pt-12 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Quy trình hoạt động tự động hóa 3 bước
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Được thiết kế tối ưu cho các nhà sáng tạo nội dung, marketer và lập trình viên
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3 font-bold">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Multi-source Ingestion
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tự động bóc tách phụ đề/transcript YouTube (hỗ trợ tiếng Anh và tiếng Việt) hoặc crawl nội dung sạch từ bất kỳ bài blog nào.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3 font-bold">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Gemini 2.5 Flash Engine
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tận dụng context window cực lớn của Gemini để xử lý trọn vẹn tài liệu dài, cấu trúc hóa thành 3 định dạng: LinkedIn, X Thread và Newsletter.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-3 font-bold">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                MongoDB Persistence
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Lưu trữ toàn bộ lịch sử biến đổi bài viết vào MongoDB, dễ dàng quản lý, truy vấn và theo dõi trực quan bằng MongoDB Compass.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
