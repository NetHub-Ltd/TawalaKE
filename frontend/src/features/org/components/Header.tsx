"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bell, 
  HelpCircle, 
  Globe, 
  User, 
  LogOut, 
  Settings, 
  Building2, 
  ShieldCheck 
} from "lucide-react";

export function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the profile dropdown menu overlay if clicking outside component scope
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-20 w-full border-b border-border/60 bg-card mb-1 flex items-center justify-between px-6 z-40 shrink-0 relative">
      
      {/* LEFT SECTION: Brand Identity / Microcopy Context */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-xs">
          <span className="text-white font-black text-sm tracking-tighter">TW</span>
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-foreground leading-none">
            Tawala Enterprise
          </h1>
          <p className="text-xs font-medium text-muted mt-1 leading-none">
            System Operational Terminal
          </p>
        </div>
      </div>

      {/* RIGHT SECTION: Quick Actions Navigation Matrix & Session Control */}
      <div className="flex items-center gap-2">
        
        {/* Core Utility Navigation Icons */}
        <nav className="flex items-center gap-1 border-r border-border/40 pr-3 mr-1" aria-label="Quick Access Utilities">
          <a
            href="#"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            title="System Notifications"
            aria-label="View notifications"
          >
            <div className="relative">
              <Bell size={16} />
              <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
            </div>
          </a>

          <a
            href="#"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            title="Documentation & Support"
            aria-label="Open support knowledgebase"
          >
            <HelpCircle size={16} />
          </a>

          <a
            href="#"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            title="Network Node Status"
            aria-label="View live region nodes"
          >
            <Globe size={16} />
          </a>
        </nav>

        {/* Profile Avatar Trigger & Dropdown Menu Context Wrapper */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface/80 border border-border/60 text-foreground flex items-center justify-center font-bold text-xs shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Toggle user profile summary overlay"
          >
            M
          </button>

          {/* Accessible Menu Dropdown Layer */}
          {dropdownOpen && (
            <div className="absolute right-0 top-11 w-64 bg-card border border-border/60 rounded-xl shadow-md p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              
              {/* Operator Identity Block */}
              <div className="px-3 py-2.5 bg-surface/40 rounded-lg border border-border/20 flex flex-col gap-1">
                <p className="text-xs font-bold text-foreground truncate">
                  Manager Operator
                </p>
                <p className="text-xs text-muted truncate">
                  ops@tawala.internal
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] uppercase font-black text-brand-accent tracking-wider">
                  <ShieldCheck size={12} />
                  <span>Access Scope: Global</span>
                </div>
              </div>

              {/* Functional User Utilities Section */}
              <a
                href="#"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              >
                <Settings size={14} />
                <span>Account Preferences</span>
              </a>

              <a
                href="#"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              >
                <Building2 size={14} />
                <span>Organization Node</span>
              </a>

              <div className="border-t border-border/40 my-1" aria-hidden="true" />

              {/* Destructive Control Termination Trigger */}
              <a
                href="#"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
              >
                <LogOut size={14} className="transition-transform group-hover:translate-x-0.5" />
                <span>Close Session</span>
              </a>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}