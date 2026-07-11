"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Globe,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  showBackButton?: boolean;
}

export default function Header({ onToggleMobileMenu, showBackButton }: HeaderProps) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    const langs = ["en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa"];
    const currentIndex = langs.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % langs.length;
    i18n.changeLanguage(langs[nextIndex]);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/20 dark:border-slate-700/30 glass-card !rounded-none backdrop-blur-2xl bg-white/60 dark:bg-[hsl(222,33%,8%)]/60">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-xl hover:bg-white/30 dark:hover:bg-slate-700/40 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          )}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl hover:bg-white/30 dark:hover:bg-slate-700/40 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm w-80 transition-all focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("nav.search")}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-slate-700/40 transition-colors group relative"
            title="Change Language"
          >
            <Globe className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-slate-700/40 transition-colors group"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
            )}
          </button>
          <button className="relative p-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-slate-700/40 transition-colors group">
            <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
          </button>
          <Link
            href="/profile"
            className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl hover:bg-white/30 dark:hover:bg-slate-700/40 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
              {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="hidden md:block text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
