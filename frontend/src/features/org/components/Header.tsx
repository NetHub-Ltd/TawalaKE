import React from 'react';

interface HeaderProps {
  organizationId: string;
}

export function Header({ organizationId }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-50 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-glow">
          <span className="text-white font-black text-lg tracking-tighter">T</span>
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight text-foreground leading-none">Tawala HQ</p>
          <p className="text-[11px] font-medium text-muted mt-1 leading-none">
            Workspace Control Panel
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/50 px-3 py-1 text-xs font-semibold text-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
          </span>
          Live Instance Node
        </div>
        <div className="text-xs text-muted border-l border-border/40 pl-4 h-4 flex items-center">
          Scope ID:&nbsp;
          <span className="font-mono text-foreground font-semibold bg-surface px-1.5 py-0.5 rounded border border-border/60 select-all">
            {organizationId.substring(0, 8)}...
          </span>
        </div>
      </div>
    </header>
  );
}