"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Shield,
  Users,
  FileText,
  BarChart3,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
  ArrowLeft,
  X,
  UserCheck,
  UserX,
  Mail,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Lock,
  Unlock,
  Layers,
  Database,
  Globe,
} from "lucide-react";
import { YoutubeIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  adminUsers: number;
  totalJobs: number;
  jobsToday: number;
  distribution: {
    youtube: number;
    article: number;
    rawText: number;
  };
  recentJobs: Array<{
    _id: string;
    sourceTitle: string;
    sourceType: string;
    userEmail: string;
    createdAt: string;
    tone: string;
  }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    authProvider: string;
    createdAt: string;
  }>;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  authProvider: string;
  createdAt: string;
  jobCount: number;
}

interface AdminJob {
  _id: string;
  sourceType: "youtube" | "article" | "raw_text";
  sourceUrl?: string;
  sourceTitle: string;
  userEmail: string;
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "jobs">("analytics");
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  // Jobs State
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobSourceFilter, setJobSourceFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);

  // Feedback Notification
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showAlert = (message: string, type: "success" | "error" = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Kiểm tra quyền Admin từ session / localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("repurposely_demo_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          setIsAdmin(parsed.role === "admin");
        } catch {
          setIsAdmin(true);
        }
      } else {
        // Mặc định cho phép dev xem thử
        setIsAdmin(true);
      }
    }
  }, []);

  // Chuyển đổi nhanh quyền Admin cho Dev/Demo
  const toggleDevAdminRole = () => {
    const nextAdmin = !isAdmin;
    setIsAdmin(nextAdmin);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("repurposely_demo_user");
      const current = stored ? JSON.parse(stored) : { name: "Creator Demo", email: "demo@repurposely.ai" };
      current.role = nextAdmin ? "admin" : "user";
      localStorage.setItem("repurposely_demo_user", JSON.stringify(current));
      setCurrentUser(current);
      window.dispatchEvent(new Event("user-role-changed"));
      showAlert(
        nextAdmin
          ? "Đã chuyển sang quyền Quản trị viên (Admin Mode)!"
          : "Đã chuyển về quyền Người dùng thường (User Mode).",
        "success"
      );
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Lỗi tải stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userRoleFilter !== "all") params.set("role", userRoleFilter);
      if (userStatusFilter !== "all") params.set("status", userStatusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Lỗi tải users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Jobs
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const params = new URLSearchParams();
      if (jobSearch) params.set("search", jobSearch);
      if (jobSourceFilter !== "all") params.set("sourceType", jobSourceFilter);

      const res = await fetch(`/api/admin/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Lỗi tải jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "jobs") fetchJobs();
  }, [activeTab]);

  // Thao tác với User: Đổi Role
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: nextRole } : u))
        );
        showAlert(`Đã đổi vai trò thành ${nextRole.toUpperCase()}`);
      }
    } catch {
      showAlert("Lỗi cập nhật vai trò", "error");
    }
  };

  // Thao tác với User: Ban / Unban
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "banned" ? "active" : "banned";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
        );
        showAlert(
          nextStatus === "banned"
            ? "Đã khóa tài khoản thành công"
            : "Đã mở khóa tài khoản thành công"
        );
      }
    } catch {
      showAlert("Lỗi cập nhật trạng thái tài khoản", "error");
    }
  };

  // Thao tác với User: Xóa User
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${email}" khỏi MongoDB?`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        showAlert("Đã xóa người dùng khỏi hệ thống");
      }
    } catch {
      showAlert("Lỗi xóa người dùng", "error");
    }
  };

  // Thao tác với Job: Xóa Job
  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bài viết "${title}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`/api/admin/jobs?jobId=${jobId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.filter((j) => j._id !== jobId));
        if (selectedJob?._id === jobId) setSelectedJob(null);
        showAlert("Đã xóa bài viết khỏi cơ sở dữ liệu");
      }
    } catch {
      showAlert("Lỗi xóa bài viết", "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-[#090d16]">
      <Navbar />

      {/* Dev Mode Admin Toggle Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-4 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-400 shrink-0" />
          <span>
            Bảng Điều Khiển Quản Trị Hệ Thống (Admin Control Center) • Vai trò hiện tại:{" "}
            <strong className="text-amber-300 uppercase">{isAdmin ? "Admin" : "User thường"}</strong>
          </span>
        </div>

        <button
          onClick={toggleDevAdminRole}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors shrink-0"
        >
          <span>{isAdmin ? "Chuyển về quyền User" : "Kích hoạt quyền Admin"}</span>
        </button>
      </div>

      {/* Alert toast */}
      {alert && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 ${
            alert.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {alert.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Main Content or 403 Forbidden State */}
      {!isAdmin ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center p-8 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xl space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mx-auto">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              403 — Quyền Truy Cập Bị Từ Chối
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Trang này chỉ dành cho tài khoản có vai trò Quản trị viên (Admin). Bạn có thể bấm nút kích hoạt quyền Admin phía trên để trải nghiệm thử nghiệm.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={toggleDevAdminRole}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Kích hoạt quyền Admin ngay
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Shield className="h-8 w-8 text-blue-600" />
                <span>Trang Quản Trị Hệ Thống (Admin Portal)</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi toàn bộ các chỉ số vận hành, quản lý tài khoản người dùng và kiểm duyệt nội dung.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeTab === "analytics") fetchStats();
                  if (activeTab === "users") fetchUsers();
                  if (activeTab === "jobs") fetchJobs();
                  showAlert("Đã làm mới dữ liệu hệ thống");
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Làm mới dữ liệu</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Thống kê tổng quan (Analytics)</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Quản lý người dùng ({stats?.totalUsers || users.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "jobs"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Kiểm duyệt bài viết ({stats?.totalJobs || jobs.length || 0})</span>
            </button>
          </div>

          {/* ================= TAB 1: ANALYTICS DASHBOARD ================= */}
          {activeTab === "analytics" && (
            <div className="space-y-8 animate-in fade-in">
              {loadingStats ? (
                <div className="py-16 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs text-slate-500 mt-2">Đang nạp số liệu phân tích...</p>
                </div>
              ) : stats ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Total Users */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Tổng Người Dùng
                        </span>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                          <Users className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                        {stats.totalUsers}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="text-emerald-600 font-medium">
                          {stats.activeUsers} hoạt động
                        </span>
                        <span>•</span>
                        <span className="text-rose-600 font-medium">
                          {stats.bannedUsers} bị khóa
                        </span>
                      </div>
                    </div>

                    {/* Total Jobs */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Tổng Lượt Chuyển Đổi
                        </span>
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          <Layers className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                        {stats.totalJobs}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Hôm nay: <strong className="text-indigo-600 font-bold">+{stats.jobsToday}</strong> lượt tạo
                      </div>
                    </div>

                    {/* YouTube vs Blog Ratio */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Nguồn Dữ Liệu Đầu Vào
                        </span>
                        <div className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                          <YoutubeIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                        {stats.distribution.youtube} / {stats.distribution.article}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {stats.distribution.youtube} YouTube • {stats.distribution.article} Blog/Web
                      </div>
                    </div>

                    {/* Admin Accounts */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Quản Trị Viên (Admins)
                        </span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                          <Shield className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                        {stats.adminUsers}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cơ chế bảo mật MongoDB Role Check
                      </div>
                    </div>
                  </div>

                  {/* Distribution Progress Bar */}
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Phân Bổ Tỷ Lệ Nguồn Nội Dung Chuyển Đổi
                    </h3>

                    {stats.totalJobs > 0 ? (
                      <div className="space-y-3">
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            style={{
                              width: `${(stats.distribution.youtube / stats.totalJobs) * 100}%`,
                            }}
                            className="bg-red-500 h-full transition-all"
                            title={`YouTube: ${stats.distribution.youtube}`}
                          />
                          <div
                            style={{
                              width: `${(stats.distribution.article / stats.totalJobs) * 100}%`,
                            }}
                            className="bg-blue-500 h-full transition-all"
                            title={`Blog/Web: ${stats.distribution.article}`}
                          />
                          <div
                            style={{
                              width: `${(stats.distribution.rawText / stats.totalJobs) * 100}%`,
                            }}
                            className="bg-indigo-500 h-full transition-all"
                            title={`Văn bản: ${stats.distribution.rawText}`}
                          />
                        </div>

                        <div className="flex items-center gap-6 text-xs flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-red-500" />
                            <span>YouTube ({Math.round((stats.distribution.youtube / stats.totalJobs) * 100)}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-blue-500" />
                            <span>Blog / Website ({Math.round((stats.distribution.article / stats.totalJobs) * 100)}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-indigo-500" />
                            <span>Văn bản thô ({Math.round((stats.distribution.rawText / stats.totalJobs) * 100)}%)</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Chưa có bài viết nào để phân tích tỷ lệ.</p>
                    )}
                  </div>

                  {/* Dual Feeds: Recent Jobs & Recent Users */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Latest Jobs Feed */}
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>Lượt Tạo Nội Dung Gần Đây</span>
                        </h3>
                        <button
                          onClick={() => setActiveTab("jobs")}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Xem tất cả
                        </button>
                      </div>

                      <div className="space-y-3">
                        {stats.recentJobs.map((j) => (
                          <div
                            key={j._id}
                            className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                {j.sourceTitle}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                Tác giả: {j.userEmail} • {j.sourceType}
                              </p>
                            </div>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {formatDate(j.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Latest Users Feed */}
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-600" />
                          <span>Thành Viên Mới Đăng Ký</span>
                        </h3>
                        <button
                          onClick={() => setActiveTab("users")}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Xem tất cả
                        </button>
                      </div>

                      <div className="space-y-3">
                        {stats.recentUsers.map((u) => (
                          <div
                            key={u._id}
                            className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold shrink-0">
                                {u.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                  {u.name}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                u.role === "admin"
                                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ================= TAB 2: USER MANAGEMENT ================= */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Filter & Search */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                    placeholder="Tìm theo tên hoặc email người dùng..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setTimeout(fetchUsers, 50);
                    }}
                    className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Chỉ Admin</option>
                    <option value="user">Chỉ User</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value);
                      setTimeout(fetchUsers, 50);
                    }}
                    className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="banned">Bị khóa</option>
                  </select>

                  <button
                    onClick={fetchUsers}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Người dùng</th>
                        <th className="px-5 py-3.5">Phương thức</th>
                        <th className="px-5 py-3.5">Vai trò</th>
                        <th className="px-5 py-3.5">Trạng thái</th>
                        <th className="px-5 py-3.5">Số bài đã tạo</th>
                        <th className="px-5 py-3.5">Ngày tham gia</th>
                        <th className="px-5 py-3.5 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Đang tải danh sách người dùng...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Không tìm thấy người dùng phù hợp.
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                            {/* Name & Email */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold shrink-0">
                                  {user.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                                    {user.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block truncate">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Auth provider */}
                            <td className="px-5 py-3.5 capitalize text-slate-500">
                              {user.authProvider || "credentials"}
                            </td>

                            {/* Role Badge */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  user.role === "admin"
                                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {user.role === "admin" ? <Shield className="h-3 w-3" /> : null}
                                <span>{user.role === "admin" ? "Admin" : "User"}</span>
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  user.status === "banned"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                }`}
                              >
                                <span>{user.status === "banned" ? "Bị khóa" : "Hoạt động"}</span>
                              </span>
                            </td>

                            {/* Job count */}
                            <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                              {user.jobCount} bài
                            </td>

                            {/* Created at */}
                            <td className="px-5 py-3.5 text-slate-400">
                              {formatDate(user.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle Role */}
                                <button
                                  onClick={() => handleToggleRole(user._id, user.role)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  title={user.role === "admin" ? "Hạ quyền xuống User" : "Thăng cấp thành Admin"}
                                >
                                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                                </button>

                                {/* Toggle Ban */}
                                <button
                                  onClick={() => handleToggleStatus(user._id, user.status)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    user.status === "banned"
                                      ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
                                      : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                  title={user.status === "banned" ? "Mở khóa tài khoản" : "Khóa tài khoản (Ban)"}
                                >
                                  {user.status === "banned" ? (
                                    <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Lock className="h-3.5 w-3.5 text-rose-500" />
                                  )}
                                </button>

                                {/* Delete User */}
                                <button
                                  onClick={() => handleDeleteUser(user._id, user.email)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Xóa vĩnh viễn user"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CONTENT MODERATION ================= */}
          {activeTab === "jobs" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Filter, Search & Export Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
                    placeholder="Tìm theo tiêu đề bài viết hoặc tác giả..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={jobSourceFilter}
                    onChange={(e) => {
                      setJobSourceFilter(e.target.value);
                      setTimeout(fetchJobs, 50);
                    }}
                    className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="all">Tất cả nguồn</option>
                    <option value="youtube">YouTube</option>
                    <option value="article">Blog / Website</option>
                    <option value="raw_text">Văn bản thô</option>
                  </select>

                  <a
                    href="/api/admin/jobs?format=csv"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Xuất CSV</span>
                  </a>

                  <button
                    onClick={fetchJobs}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </div>

              {/* Jobs Table */}
              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Tiêu đề bài viết</th>
                        <th className="px-5 py-3.5">Nguồn</th>
                        <th className="px-5 py-3.5">Tác giả (Email)</th>
                        <th className="px-5 py-3.5">Định dạng</th>
                        <th className="px-5 py-3.5">Ngày tạo</th>
                        <th className="px-5 py-3.5 text-right">Kiểm duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {loadingJobs ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            Đang tải danh sách bài viết...
                          </td>
                        </tr>
                      ) : jobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            Không tìm thấy bài viết nào.
                          </td>
                        </tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                            {/* Title */}
                            <td className="px-5 py-3.5 max-w-xs">
                              <span className="font-bold text-slate-900 dark:text-white block truncate leading-snug">
                                {job.sourceTitle}
                              </span>
                              {job.sourceUrl && (
                                <a
                                  href={job.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <span>Xem nguồn gốc</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </td>

                            {/* Source type */}
                            <td className="px-5 py-3.5">
                              {job.sourceType === "youtube" ? (
                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                  <YoutubeIcon className="h-3 w-3" />
                                  <span>YouTube</span>
                                </span>
                              ) : job.sourceType === "article" ? (
                                <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                  <Globe className="h-3 w-3" />
                                  <span>Blog/Web</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                  <FileText className="h-3 w-3" />
                                  <span>Văn bản</span>
                                </span>
                              )}
                            </td>

                            {/* Author Email */}
                            <td className="px-5 py-3.5 text-slate-500 font-medium">
                              {job.userEmail || "guest@repurposely.ai"}
                            </td>

                            {/* Formats */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                  LinkedIn
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {job.twitterThread?.length || 0} Tweets
                                </span>
                                {job.newsletter && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                    Email
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-5 py-3.5 text-slate-400">
                              {formatDate(job.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedJob(job)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  title="Xem chi tiết toàn bộ nội dung"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>

                                <Link
                                  href={`/?jobId=${job._id}`}
                                  className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                                  title="Mở trong trình tạo trang chủ"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </Link>

                                <button
                                  onClick={() => handleDeleteJob(job._id, job.sourceTitle)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Xóa bài viết vi phạm"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Job Detail Inspection Modal */}
          {selectedJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0 pr-4">
                    <span className="text-xs font-bold uppercase text-blue-600">
                      Kiểm duyệt bài viết ({selectedJob.sourceType})
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {selectedJob.sourceTitle}
                    </h3>
                  </div>

                  <button
                    onClick={() => setSelectedJob(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                  {/* LinkedIn */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-blue-600">
                      LinkedIn Post:
                    </h4>
                    <p className="whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
                      {selectedJob.linkedinPost.content}
                    </p>
                  </div>

                  {/* Twitter Thread */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Twitter Thread ({selectedJob.twitterThread?.length || 0} tweets):
                    </h4>
                    <div className="space-y-2 divide-y divide-slate-200 dark:divide-slate-800">
                      {selectedJob.twitterThread?.map((t, idx) => (
                        <div key={idx} className="pt-2 whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
                          {t.content}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Newsletter */}
                  {selectedJob.newsletter && (
                    <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                      <h4 className="font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wider text-[11px]">
                        Newsletter ({selectedJob.newsletter.subject})
                      </h4>
                      <p className="whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
                        {selectedJob.newsletter.content}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-950/30">
                  <button
                    onClick={() => handleDeleteJob(selectedJob._id, selectedJob.sourceTitle)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                  >
                    Xóa bài viết này
                  </button>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
