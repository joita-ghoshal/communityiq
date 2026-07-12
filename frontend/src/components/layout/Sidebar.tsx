"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  Shield,
  Flame,
  Award,
  LogOut,
  Heart,
  ChevronRight,
  UserCog,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "nav.dashboard", roles: ["citizen", "volunteer", "department_admin", "municipal_admin", "super_admin"] },
  { href: "/map", icon: Map, labelKey: "nav.map", roles: ["citizen", "volunteer", "department_admin", "municipal_admin", "super_admin"] },
  { href: "/report", icon: AlertTriangle, labelKey: "nav.report", roles: ["citizen", "volunteer", "department_admin", "municipal_admin", "super_admin"] },
  { href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", roles: ["department_admin", "municipal_admin", "super_admin"] },
  { href: "/heroes", icon: Award, labelKey: "nav.heroes", roles: ["citizen", "volunteer", "department_admin", "municipal_admin", "super_admin"] },
  { href: "/emergency", icon: Flame, labelKey: "nav.emergency", roles: ["citizen", "volunteer", "department_admin", "municipal_admin", "super_admin"] },
  { href: "/settings", icon: Settings, labelKey: "nav.settings", roles: ["citizen", "volunteer", "department_admin", "municipal_admin", "super_admin"] },
  { href: "/ai-assistant", icon: Sparkles, labelKey: "nav.aiAssistant", roles: ["citizen", "volunteer", "department_admin", "municipal_admin", "super_admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { logout } = useAuthStore();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300 border-r",
          collapsed ? "w-[72px]" : "w-[260px]",
          "glass-sidebar"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-5 py-5 border-b border-white/20 dark:border-slate-700/30",
          collapsed && "justify-center px-3"
        )}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-slate-800 dark:text-white truncate">
                CommunityIQ
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                Enterprise Platform
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-slate-700/40 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
              collapsed && "ml-0"
            )}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative",
                  collapsed && "flex justify-center"
                )}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "sidebar-link-active"
                      : "sidebar-link"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate">{t(item.labelKey)}</span>
                  )}
                </div>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Panel Button */}
        {user?.role === "super_admin" && (
          <div className="px-3 pb-2">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                pathname === "/admin"
                  ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700 dark:text-indigo-300 border-l-3 border-indigo-500"
                  : "text-slate-500 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-slate-700/40 hover:text-indigo-600 dark:hover:text-indigo-400"
              )}
            >
              <UserCog className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Admin Panel</span>}
            </Link>
          </div>
        )}

        {/* User Profile + Logout */}
        <div className="px-3 py-4 border-t border-white/20 dark:border-slate-700/30 space-y-2">
          {user && (
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/30 dark:hover:bg-slate-700/40",
                collapsed && "justify-center px-2"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-blue-500/20">
                {user.firstName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {user.firstName ? `${user.firstName} ${user.lastName}` : "User"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">
                    {user.role?.replace("_", " ")}
                  </span>
                </div>
              )}
            </Link>
          )}
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 w-full",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 dark:border-slate-700/30 safe-area-inset-bottom glass-sidebar">
        <div className="flex items-center justify-around py-2 px-2">
          {filteredNavItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-blue-600 dark:text-blue-400")} />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
                {isActive && (
                  <div className="absolute top-0 w-8 h-[3px] bg-blue-500 rounded-b-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
