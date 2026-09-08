"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  History,
  Globe,
  FileText,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Database,
  Calendar,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
  X,
  Mail,
} from "lucide-react";
import { YoutubeIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

interface RepurposeItem {
  _id: string;
  sourceType: "youtube" | "article" | "raw_text";
  sourceUrl?: string;
  sourceTitle: string;
  tone: string;
  keyTakeaways: string[];
  linkedinPost: {
    content: string;
    hashtags: string[];
  };
  twitterThread: Array<{
    tweetNumber: number;
    content: string;
  }>;
  newsletter?: {
    subject: string;
    previewText: string;
    content: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<RepurposeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "youtube" | "article" | "raw_text">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<RepurposeItem | null>(null);
  const [copiedCompassUri, setCopiedCompassUri] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Lỗi tải jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này khỏi cơ sở dữ liệu MongoDB?")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((item) => item._id !== id));
        if (selectedJob?._id === id) {
          setSelectedJob(null);
        }
      }
    } catch (err) {
      console.error("Lỗi xóa job:", err);
    }
  };

  const handleCopy = async (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Lỗi copy:", err);
    }
  };

  const handleCopyCompassUri = async () => {
    try {
      await navigator.clipboard.writeText("mongodb://localhost:27017");
      setCopiedCompassUri(true);
      setTimeout(() => setCopiedCompassUri(false), 2000);
    } catch (err) {
      console.error("Lỗi copy URI:", err);
    }
  };

  const handleExportJob = (job: RepurposeItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const markdownContent = `# ${job.sourceTitle}
**Nguồn**: ${job.sourceType} ${job.sourceUrl ? `(${job.sourceUrl})` : ""}
**Thời gian tạo**: ${formatDate(job.createdAt)}
**Giọng điệu**: ${job.tone}

---

## 💡 Key Takeaways
${(job.keyTakeaways || []).map((t, idx) => `${idx + 1}. ${t}`).join("\n")}

---

## 💼 LinkedIn Post
${job.linkedinPost.content}

${(job.linkedinPost.hashtags || []).join(" ")}

---

## 🧵 Twitter / X Thread
${job.twitterThread.map((t) => t.content).join("\n\n---\n\n")}

${
  job.newsletter
    ? `---

## 📬 Email Newsletter
### ${job.newsletter.subject}
*${job.newsletter.previewText}*

${job.newsletter.content}`
    : ""
}
`;

    const element = document.createElement("a");
    const file = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `repurposed-${job._id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const handleExportAllJson = () => {
    if (jobs.length === 0) return;
    const jsonStr = JSON.stringify(jobs, null, 2);
    const element = document.createElement("a");
    const file = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `repurposely-backup-${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.sourceTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.linkedinPost?.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || job.sourceType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-[#090d16]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Quay lại trang tạo</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <History className="h-7 w-7 text-blue-600" />
              <span>Kho Lưu Trữ & Lịch Sử Tái Chế Nội Dung</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tất cả các lần chuyển đổi nội dung đều được lưu trữ trực tiếp trong cơ sở dữ liệu <strong>MongoDB</strong> (dễ dàng kiểm tra bằng MongoDB Compass).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAllJson}
              disabled={jobs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm transition-colors disabled:opacity-50"
              title="Tải toàn bộ cơ sở dữ liệu về máy dạng JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất JSON Backup</span>
            </button>

            <button
              onClick={fetchJobs}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* MongoDB Compass Helper Box */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shrink-0 mt-0.5">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Quan sát trực tiếp dữ liệu qua MongoDB Compass
              </h4>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400 mt-0.5">
                Database: <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded font-mono">repurposely</code> •
                Collection: <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded font-mono">repurposejobs</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <code className="text-[11px] font-mono bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800 text-slate-700 dark:text-slate-300">
              mongodb://localhost:27017
            </code>
            <button
              onClick={handleCopyCompassUri}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 shadow-sm"
            >
              {copiedCompassUri ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCompassUri ? "Đã chép!" : "Copy URI"}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "Tất cả" },
              { id: "youtube", label: "YouTube" },
              { id: "article", label: "Blog / Web" },
              { id: "raw_text", label: "Văn bản" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as typeof filterType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === f.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <Database className="h-4 w-4 text-blue-600" />
            <span>
              Bản ghi: <strong className="text-slate-900 dark:text-white">{filteredJobs.length}</strong> / {jobs.length}
            </span>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-sm text-slate-500">Đang truy vấn dữ liệu từ MongoDB...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mx-auto">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chưa có bài viết nào được lưu trữ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy thử nhập một link video YouTube hoặc một bài blog ở trang chủ để hệ thống tạo và lưu bản ghi đầu tiên vào MongoDB.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tạo bài viết mới ngay</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isCopied = copiedId === job._id;
              const fullText = `[LINKEDIN POST]\n${job.linkedinPost.content}\n\n[TWITTER THREAD]\n${job.twitterThread
                .map((t) => t.content)
                .join("\n\n")}${
                job.newsletter ? `\n\n[NEWSLETTER]\n${job.newsletter.subject}\n\n${job.newsletter.content}` : ""
              }`;

              return (
                <div
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all dark:border-slate-800 dark:bg-slate-900 cursor-pointer group"
                >
                  <div className="space-y-3">
                    {/* Header: Source type & date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {job.sourceType === "youtube" ? (
                          <span className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                            <YoutubeIcon className="h-3.5 w-3.5" />
                            <span>YouTube</span>
                          </span>
                        ) : job.sourceType === "article" ? (
                          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                            <Globe className="h-3.5 w-3.5" />
                            <span>Blog/Web</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Văn bản</span>
                          </span>
                        )}

                        <span className="capitalize text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                          {job.tone || "professional"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {job.sourceTitle}
                    </h3>

                    {/* Snippet Preview */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {job.linkedinPost.content}
                    </p>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 flex-wrap">
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 px-2 py-0.5 rounded">
                        1 LinkedIn
                      </span>
                      <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded">
                        {job.twitterThread?.length || 0} Tweets
                      </span>
                      {job.newsletter && (
                        <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 px-2 py-0.5 rounded">
                          Newsletter
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopy(job._id, fullText, e)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isCopied
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{isCopied ? "Đã copy!" : "Copy"}</span>
                      </button>

                      <Link
                        href={`/?jobId=${job._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                        title="Mở bài viết này trong trình tạo và xem trước"
                      >
                        <span>Sửa / Xem</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleExportJob(job, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                        title="Xuất file Markdown (.md)"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                          title="Mở link gốc"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}

                      <button
                        onClick={(e) => handleDelete(job._id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa bản ghi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Full Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-blue-600">
                    {selectedJob.sourceType}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">{formatDate(selectedJob.createdAt)}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {selectedJob.sourceTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/?jobId=${selectedJob._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Mở trong Trình tạo</span>
                </Link>

                <button
                  onClick={() => handleExportJob(selectedJob)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800"
                  title="Tải về .md"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Takeaways */}
              {selectedJob.keyTakeaways && selectedJob.keyTakeaways.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    Key Takeaways
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
                    {selectedJob.keyTakeaways.map((k, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* LinkedIn Post */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    LinkedIn Post
                  </span>
                  <button
                    onClick={() => handleCopy(selectedJob._id + "-li", selectedJob.linkedinPost.content)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Sao chép
                  </button>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {selectedJob.linkedinPost.content}
                </p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedJob.linkedinPost.hashtags?.map((t, idx) => (
                    <span key={idx} className="text-xs text-blue-600 dark:text-blue-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Twitter Thread */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-white"></span>
                    Twitter / X Thread ({selectedJob.twitterThread.length} tweets)
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedJob._id + "-tw",
                        selectedJob.twitterThread.map((t) => t.content).join("\n\n---\n\n")
                      )
                    }
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Sao chép toàn bộ Thread
                  </button>
                </div>
                <div className="space-y-2 divide-y divide-slate-200/60 dark:divide-slate-800">
                  {selectedJob.twitterThread.map((tweet, i) => (
                    <div key={i} className="pt-2 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {tweet.content}
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter if present */}
              {selectedJob.newsletter && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-900/40 dark:bg-purple-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-purple-600" />
                      Newsletter Broadcast
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          selectedJob._id + "-nl",
                          `# ${selectedJob.newsletter?.subject}\n\n${selectedJob.newsletter?.content}`
                        )
                      }
                      className="text-xs font-medium text-purple-600 hover:underline"
                    >
                      Sao chép Email
                    </button>
                  </div>
                  <h5 className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Tiêu đề: {selectedJob.newsletter.subject}
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {selectedJob.newsletter.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
