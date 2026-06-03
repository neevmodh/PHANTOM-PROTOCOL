"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  ImageIcon,
  Video,
  Mic,
  FileText,
  Link2,
  BarChart2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Detection",
    items: [
      { label: "Image", href: "/image-detection", icon: ImageIcon },
      { label: "Video", href: "/video-detection", icon: Video },
      { label: "Audio", href: "/audio-detection", icon: Mic },
      { label: "Document", href: "/document-detection", icon: FileText },
      { label: "URL", href: "/url-detection", icon: Link2 },
    ],
  },
  {
    group: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart2 },
      { label: "Reports", href: "/reports", icon: FileDown },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: open ? 240 : 64 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-cyber-surface border-r border-cyber-border overflow-hidden shrink-0 z-20"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-cyber-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center shrink-0 shadow-cyber">
            <Shield className="w-4 h-4 text-cyber-bg" />
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold text-cyber-accent tracking-widest text-glow-accent">
                  ISAFE
                </p>
                <p className="text-[10px] text-cyber-muted truncate">
                  Forensic Engine
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
        {NAV_ITEMS.map((group) => (
          <div key={group.group} className="mb-4">
            <AnimatePresence>
              {open && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 mb-1.5 text-[10px] font-semibold text-cyber-muted uppercase tracking-widest"
                >
                  {group.group}
                </motion.p>
              )}
            </AnimatePresence>

            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative",
                    active
                      ? "bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20 shadow-cyber-sm"
                      : "text-cyber-muted-light hover:bg-cyber-card hover:text-cyber-text"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      active ? "text-cyber-accent" : "text-cyber-muted group-hover:text-cyber-text"
                    )}
                  />
                  <AnimatePresence>
                    {open && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="truncate font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-cyber-accent shadow-cyber-sm"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Status indicator */}
      <div className="border-t border-cyber-border p-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse-slow" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyber-green/40 animate-ping" />
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-[11px] text-cyber-green font-medium">System Online</p>
                <p className="text-[10px] text-cyber-muted">All engines active</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-cyber-card border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-cyber-accent hover:border-cyber-accent transition-colors z-30 shadow-glass"
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
