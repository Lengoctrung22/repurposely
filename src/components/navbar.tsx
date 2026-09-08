"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  History,
  Layers,
  Database,
  Key,
  Moon,
  Sun,
  LogIn,
  LogOut,
  User as UserIcon,
  Shield,
} from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";

export function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check stored API key
      const key = localStorage.getItem("repurposely_gemini_api_key");
      setHasCustomKey(Boolean(key && key.trim().length > 0));

      // Check stored Demo user
      const loadUser = () => {
        const storedUser = localStorage.getItem("repurposely_demo_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      };

      loadUser();
      window.addEventListener("storage", loadUser);
      window.addEventListener("user-role-changed", loadUser);

      // Check theme
      const isDark =
        localStorage.getItem("theme") === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return () => {
        window.removeEventListener("storage", loadUser);
        window.removeEventListener("user-role-changed", loadUser);
      };
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("repurposely_demo_user");
      setUser(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                Repurposely<span className="text-blue-600 dark:text-blue-400">.ai</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                Content Multiplier SaaS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Tạo bài viết</span>
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/dashboard"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Lịch sử & Kho lưu trữ</span>
            </Link>

            {/* Admin Link (visible if user is admin or already in admin route) */}
            {(user?.role === "admin" || pathname === "/admin") && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === "/admin"
                    ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 font-semibold"
                    : "text-amber-700 hover:bg-amber-50/80 dark:text-amber-400 dark:hover:bg-amber-950/40"
                }`}
              >
                <Shield className="h-4 w-4 text-amber-500" />
                <span>Quản trị</span>
              </Link>
            )}
          </nav>

          {/* Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* MongoDB status pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="h-3 w-3" />
              <span>MongoDB Compass Ready</span>
            </div>

            {/* Settings / API Key Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Cấu hình Gemini API Key"
            >
              <Key className={`h-4 w-4 ${hasCustomKey ? "text-emerald-500" : ""}`} />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Auth / Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm"
                  title={user.email}
                >
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySaved={(key) => setHasCustomKey(Boolean(key && key.trim()))}
      />
    </>
  );
}
