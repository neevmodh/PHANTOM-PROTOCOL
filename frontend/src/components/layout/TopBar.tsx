"use client";

import { Menu, Bell, Settings, Search, Zap } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-sm shrink-0 z-10">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-card transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyber-muted" />
        <input
          type="text"
          placeholder="Search detections, reports..."
          className="input-cyber pl-9 py-2 text-xs h-9"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-green/10 border border-cyber-green/20">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse-slow" />
          <span className="text-[11px] text-cyber-green font-medium">LIVE</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-card transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyber-red" />
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-card transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center text-cyber-bg text-xs font-bold shadow-cyber-sm">
          IS
        </div>
      </div>
    </header>
  );
}
