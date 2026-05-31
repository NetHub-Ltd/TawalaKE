import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Store, 
  Users2, 
  Receipt, 
  BarChart3, 
  Settings, 
  ShieldCheck 
} from 'lucide-react';

interface SidebarProps {
  organizationId: string;
}

export function Sidebar({ organizationId }: SidebarProps) {
  // Navigation array structured around clean, executive business operations mapping
  const navigationItems = [
    {
      label: 'Overview',
      href: `/org/${organizationId}/dashboard`,
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />,
      active: true, // Mocked active state for core landing index
    },
    {
      label: 'Stores & Registers',
      href: `/org/${organizationId}/terminal`,
      icon: <Store className="w-4 h-4 shrink-0" aria-hidden="true" />,
      active: false,
    },
    {
      label: 'Staff Members',
      href: `/org/${organizationId}/staff`,
      icon: <Users2 className="w-4 h-4 shrink-0" aria-hidden="true" />,
      active: false,
    },
    {
      label: 'Profile',
      href: `/org/${organizationId}/staff`,
      icon: <Users2 className="w-4 h-4 shrink-0" aria-hidden="true" />,
      active: false,
    },
    {
      label: 'Settings',
      href: `/org/${organizationId}/settings`,
      icon: <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />,
      active: false,
    },
  ];

  return (
    <aside 
      className="w-64 border-r border-border/40 bg-background flex flex-col justify-between shrink-0 hidden md:flex"
      aria-label="Workspace Navigation"
    >
      <div className="p-4 space-y-6">
        {/* Navigation Section Group */}
        <div>
          <div className="px-3 mb-3 text-[10px] font-bold tracking-widest uppercase text-muted">
            Management
          </div>
          
          <nav aria-label="Main Organization Routes">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      item.active
                        ? 'bg-brand-primary/10 text-brand-primary shadow-[inset_0_0_0_1px_rgba(79,70,229,0.1)]'
                        : 'text-muted hover:text-foreground hover:bg-surface/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Account Verification Profile Footer Anchor */}
      <div className="p-4 border-t border-border/40 bg-surface/30">
        <div className="rounded-xl border border-border/40 bg-background p-3 flex items-center gap-3 shadow-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="overflow-hidden">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted leading-none">Access Level</span>
            <span className="block text-xs font-bold text-foreground mt-1 truncate">Business Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
}