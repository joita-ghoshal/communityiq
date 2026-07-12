"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Globe,
  Menu,
  ChevronLeft,
  CheckCheck,
  X,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  showBackButton?: boolean;
}

export default function Header({ onToggleMobileMenu, showBackButton }: HeaderProps) {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    const langs = ["en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa"];
    const currentIndex = langs.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % langs.length;
    i18n.changeLanguage(langs[nextIndex]);
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      const count = data.data?.unreadCount ?? data.unreadCount ?? 0;
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const { data } = await api.get("/notifications?limit=15");
      const items = data.data?.data || data.data || data.notifications || data || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch {
      // silently fail
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "emergency": return "🚨";
      case "ai_alert": return "🤖";
      case "status_update": return "📋";
      case "community": return "👥";
      case "volunteer": return "🤝";
      case "government": return "🏛️";
      default: return "🔔";
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotifications}
              className="relative p-2.5 rounded-xl hover:bg-white/30 dark:hover:bg-slate-700/40 transition-colors group"
            >
              <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold text-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="p-1.5 rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4">
                        <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You&apos;ll be notified about updates</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30",
                            !notif.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                          )}
                        >
                          <span className="text-lg flex-shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-sm leading-snug", notif.isRead ? "text-slate-600 dark:text-slate-400" : "font-semibold text-slate-900 dark:text-white")}>
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button
                        onClick={() => { setShowNotifications(false); }}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
