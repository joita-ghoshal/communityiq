export interface PageTheme {
  background: string;
  gradient: string;
  cardAccent: string;
  description: string;
  icon: string;
}

export const pageThemes: Record<string, PageTheme> = {
  dashboard: {
    background: "from-[hsl(204,60%,96%)] via-[hsl(200,50%,94%)] to-[hsl(195,45%,95%)] dark:from-[hsl(222,33%,8%)] dark:via-[hsl(225,30%,11%)] dark:to-[hsl(220,28%,14%)]",
    gradient: "from-blue-400/10 via-cyan-300/8 to-sky-200/10 dark:from-blue-500/10 dark:via-indigo-500/8 dark:to-sky-400/10",
    cardAccent: "from-blue-500 to-cyan-500",
    description: "Your civic intelligence command center",
    icon: "📊",
  },
  map: {
    background: "from-[hsl(195,50%,96%)] via-[hsl(200,45%,94%)] to-[hsl(190,40%,95%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(218,28%,11%)] dark:to-[hsl(222,32%,13%)]",
    gradient: "from-emerald-400/10 via-teal-300/8 to-cyan-200/10 dark:from-emerald-500/10 dark:via-teal-500/8 dark:to-cyan-400/10",
    cardAccent: "from-emerald-500 to-teal-500",
    description: "Explore community issues on an interactive map",
    icon: "🗺️",
  },
  report: {
    background: "from-[hsl(200,55%,96%)] via-[hsl(204,48%,94%)] to-[hsl(198,42%,95%)] dark:from-[hsl(218,35%,8%)] dark:via-[hsl(220,30%,11%)] dark:to-[hsl(216,28%,14%)]",
    gradient: "from-blue-400/10 via-indigo-300/8 to-violet-200/10 dark:from-blue-500/10 dark:via-indigo-500/8 dark:to-violet-400/10",
    cardAccent: "from-blue-500 to-indigo-500",
    description: "Report a new issue to your local government",
    icon: "📝",
  },
  settings: {
    background: "from-[hsl(210,40%,96%)] via-[hsl(205,38%,95%)] to-[hsl(200,35%,94%)] dark:from-[hsl(225,28%,8%)] dark:via-[hsl(222,25%,11%)] dark:to-[hsl(220,28%,13%)]",
    gradient: "from-slate-400/10 via-gray-300/8 to-zinc-200/10 dark:from-slate-500/10 dark:via-gray-500/8 dark:to-zinc-400/10",
    cardAccent: "from-slate-500 to-gray-500",
    description: "Customize your experience",
    icon: "⚙️",
  },
  emergency: {
    background: "from-[hsl(0,50%,96%)] via-[hsl(350,45%,95%)] to-[hsl(5,40%,94%)] dark:from-[hsl(0,30%,8%)] dark:via-[hsl(350,28%,10%)] dark:to-[hsl(5,25%,12%)]",
    gradient: "from-red-400/10 via-rose-300/8 to-orange-200/10 dark:from-red-500/10 dark:via-rose-500/8 dark:to-orange-400/10",
    cardAccent: "from-red-500 to-rose-500",
    description: "Emergency alerts and quick response tools",
    icon: "🚨",
  },
  analytics: {
    background: "from-[hsl(260,40%,96%)] via-[hsl(250,38%,95%)] to-[hsl(245,35%,94%)] dark:from-[hsl(260,28%,8%)] dark:via-[hsl(250,25%,11%)] dark:to-[hsl(245,28%,13%)]",
    gradient: "from-violet-400/10 via-purple-300/8 to-fuchsia-200/10 dark:from-violet-500/10 dark:via-purple-500/8 dark:to-fuchsia-400/10",
    cardAccent: "from-violet-500 to-purple-500",
    description: "Deep insights into community trends",
    icon: "📈",
  },
  profile: {
    background: "from-[hsl(200,45%,96%)] via-[hsl(195,42%,95%)] to-[hsl(190,38%,94%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(218,28%,11%)] dark:to-[hsl(215,32%,13%)]",
    gradient: "from-sky-400/10 via-blue-300/8 to-cyan-200/10 dark:from-sky-500/10 dark:via-blue-500/8 dark:to-cyan-400/10",
    cardAccent: "from-sky-500 to-blue-500",
    description: "Manage your profile and account",
    icon: "👤",
  },
  heroes: {
    background: "from-[hsl(45,50%,96%)] via-[hsl(35,45%,95%)] to-[hsl(25,40%,94%)] dark:from-[hsl(30,28%,8%)] dark:via-[hsl(25,25%,11%)] dark:to-[hsl(20,28%,13%)]",
    gradient: "from-amber-400/10 via-orange-300/8 to-yellow-200/10 dark:from-amber-500/10 dark:via-orange-500/8 dark:to-yellow-400/10",
    cardAccent: "from-amber-500 to-orange-500",
    description: "Recognizing outstanding community volunteers",
    icon: "🏆",
  },
  admin: {
    background: "from-[hsl(220,35%,96%)] via-[hsl(215,32%,95%)] to-[hsl(210,30%,94%)] dark:from-[hsl(225,30%,8%)] dark:via-[hsl(222,28%,11%)] dark:to-[hsl(220,32%,13%)]",
    gradient: "from-indigo-400/10 via-blue-300/8 to-slate-200/10 dark:from-indigo-500/10 dark:via-blue-500/8 dark:to-slate-400/10",
    cardAccent: "from-indigo-500 to-blue-500",
    description: "System management and administration",
    icon: "🛡️",
  },
  login: {
    background: "from-[hsl(204,60%,96%)] via-[hsl(200,50%,93%)] to-[hsl(195,55%,95%)] dark:from-[hsl(222,33%,8%)] dark:via-[hsl(225,35%,12%)] dark:to-[hsl(220,30%,10%)]",
    gradient: "from-blue-400/15 via-cyan-300/10 to-sky-200/10 dark:from-blue-500/15 dark:via-cyan-500/10 dark:to-sky-400/10",
    cardAccent: "from-blue-500 to-cyan-500",
    description: "Welcome back to CommunityIQ",
    icon: "🔐",
  },
  register: {
    background: "from-[hsl(200,55%,96%)] via-[hsl(195,50%,94%)] to-[hsl(190,45%,95%)] dark:from-[hsl(220,30%,8%)] dark:via-[hsl(218,32%,12%)] dark:to-[hsl(222,28%,10%)]",
    gradient: "from-sky-400/15 via-blue-300/10 to-indigo-200/10 dark:from-sky-500/15 dark:via-blue-500/10 dark:to-indigo-400/10",
    cardAccent: "from-sky-500 to-blue-500",
    description: "Join the civic intelligence community",
    icon: "🚀",
  },
  government: {
    background: "from-[hsl(210,40%,96%)] via-[hsl(205,35%,95%)] to-[hsl(200,32%,94%)] dark:from-[hsl(225,28%,8%)] dark:via-[hsl(222,25%,11%)] dark:to-[hsl(220,28%,13%)]",
    gradient: "from-indigo-400/10 via-blue-300/8 to-sky-200/10 dark:from-indigo-500/10 dark:via-blue-500/8 dark:to-sky-400/10",
    cardAccent: "from-indigo-500 to-blue-500",
    description: "Government portal and official resources",
    icon: "🏛️",
  },
  ai_assistant: {
    background: "from-[hsl(200,50%,96%)] via-[hsl(195,45%,94%)] to-[hsl(200,40%,95%)] dark:from-[hsl(222,33%,8%)] dark:via-[hsl(220,30%,11%)] dark:to-[hsl(218,28%,13%)]",
    gradient: "from-sky-400/10 via-cyan-300/8 to-blue-200/10 dark:from-sky-500/10 dark:via-cyan-500/8 dark:to-blue-400/10",
    cardAccent: "from-sky-500 to-cyan-500",
    description: "AI-powered civic assistant",
    icon: "🤖",
  },
};

export const getPageTheme = (path: string): PageTheme => {
  if (path === "/") return pageThemes.dashboard;
  if (path.startsWith("/map")) return pageThemes.map;
  if (path.startsWith("/report")) return pageThemes.report;
  if (path.startsWith("/settings")) return pageThemes.settings;
  if (path.startsWith("/emergency")) return pageThemes.emergency;
  if (path.startsWith("/analytics")) return pageThemes.analytics;
  if (path.startsWith("/profile")) return pageThemes.profile;
  if (path.startsWith("/heroes")) return pageThemes.heroes;
  if (path.startsWith("/admin")) return pageThemes.admin;
  return pageThemes.dashboard;
};

export const severityColors = {
  low: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  medium: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  },
  critical: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  },
} as const;

export type SeverityLevel = keyof typeof severityColors;
