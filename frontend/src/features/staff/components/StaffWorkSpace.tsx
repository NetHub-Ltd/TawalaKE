"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { 
  UserPlus, 
  RefreshCw, 
  Shield, 
  Mail, 
  Search, 
  UserCheck, 
  UserX, 
  Loader2, 
  AlertCircle,
  Users
} from "lucide-react";

/**
 * @Scribe_Audit
 * Aesthetic: High-density, performance-tuned terminal layout engineered using Silk & Slate design tokens[cite: 1].
 * Layout: Viewport-locked administrative shell that isolates vertical scroll behaviors exclusively to data rows.
 */
export default function StaffWorkspace() {
  const { businessId, organizationId } = useBusinessContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const normalizedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId || "";
  const normalizedBusinessId = Array.isArray(businessId) ? businessId[0] : businessId || "";

  // Connect to the synchronized custom query hook architecture
  const { staff, isLoading, isFetching, isError, error, refetch } = useStaff(normalizedOrgId);

  // High-performance operational sorting filter grid pass
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch = 
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "ALL" || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staff, searchTerm, roleFilter]);

  // Evaluates conditional state badge color treatments
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "ADMIN":
        return "bg-brand-primary/10 text-brand-primary border-brand-primary/20"; // Indigo token[cite: 1]
      case "MANAGER":
        return "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20"; // Cyan token[cite: 1]
      default:
        return "bg-surface text-muted border-border/40"; // Soft neutral[cite: 1]
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-card border border-border/40 rounded-[2rem] shadow-lift overflow-hidden animate-in fade-in duration-200">
      
      {/* CONTROL ACTIONS MATRIX (Fixed Header Layer) */}
      <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 border-b border-border/40 bg-surface/20 shrink-0 select-none">
        <div className="space-y-0.5">
          <h1 className="text-sm font-black uppercase tracking-tight text-foreground flex items-center gap-2 my-0">
            <Users size={16} className="text-brand-primary" />
            Operator Access Matrix
          </h1>
          <p className="text-[11px] text-muted font-medium">
            Manage authenticated enterprise keys linked to business cell: <span className="font-mono bg-background border border-border/40 px-1 rounded text-[10px] text-foreground font-bold">{normalizedBusinessId}</span>
          </p>
        </div>

        {/* Action Controls Frame */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Text Query Field */}
          <div className="relative max-w-xs w-full min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50" size={13} />
            <input
              type="text"
              placeholder="Search identity or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-8 pr-4 bg-background border border-border/40 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-brand-primary/40 transition-all placeholder:text-muted/40"
            />
          </div>

          {/* Role Filter Dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-xl bg-background border border-border/40 text-xs font-bold text-foreground px-3 focus:outline-none focus:border-brand-primary/40 cursor-pointer transition-all"
          >
            <option value="ALL">All Authorities</option>
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="CASHIER">CASHIER</option>
            <option value="OPERATOR">OPERATOR</option>
          </select>

          {/* Background Roster Synchronizer */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="h-10 w-10 rounded-xl bg-background border border-border/40 hover:border-brand-primary/30 flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer text-foreground"
            title="Force Synchronize Roster"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin text-brand-primary" : ""} />
          </button>

          {/* Transaction Launcher: Provision Staff CTA */}
          <Link 
            href={`/org/${normalizedOrgId}/${normalizedBusinessId}/staff/register`}
            className="h-10 px-4 rounded-xl bg-brand-primary text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-brand-primary/90 transition-all min-h-[40px] shadow-xs"
          >
            <UserPlus size={13} />
            <span>Provision Operator</span>
          </Link>
        </div>
      </div>

      {/* CORE DISPLAY DATA GRID BOUNDARY */}
      <div className="flex-1 flex flex-col min-h-0 w-full relative">
        
        {/* STRUCTURAL HEADER ROW LAYER (Remains pinned safely above data cascades) */}
        <div className="w-full overflow-x-auto no-scrollbar shrink-0 bg-surface/50 border-b border-border/40 z-10 select-none">
          <table className="w-full min-w-[700px] border-collapse text-left table-fixed">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wider text-muted font-mono">
                <th className="py-3.5 px-6 w-[30%]">Identity Node / Email Connection</th>
                <th className="py-3.5 px-4 w-[25%]">Unique Operator Identifier</th>
                <th className="py-3.5 px-4 w-[20%]">Privilege Matrix</th>
                <th className="py-3.5 px-6 w-[25%] text-right">System Connection Status</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* INTERNAL VERTICAL SCROLL PORT LAYER */}
        <div className="flex-1 overflow-y-auto w-full bg-card min-h-0 relative">
          {isLoading ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-2 text-center select-none">
                <Loader2 className="animate-spin text-brand-primary" size={20} />
                <p className="text-[11px] font-medium text-muted font-mono">Streaming personnel clusters...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6">
              <div className="text-center max-w-sm space-y-2">
                <AlertCircle className="text-brand-accent mx-auto" size={18} />
                <p className="text-xs font-bold uppercase text-foreground">Cluster Fetch Failure</p>
                <p className="text-[11px] text-muted font-mono leading-relaxed">{error?.message || "Internal RPC Error"}</p>
              </div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12 text-center select-none">
              <Shield className="text-muted/30 mb-2" size={24} />
              <p className="text-xs font-black uppercase tracking-wide text-foreground">Zero Vectors Configured</p>
              <p className="text-[11px] text-muted max-w-xs mt-0.5">No operator nodes match the filter parameters requested.</p>
            </div>
          ) : (
            <table className="w-full min-w-[700px] border-collapse text-left table-fixed">
              <tbody className="divide-y divide-border/30 text-xs font-medium text-muted">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-surface/30 transition-colors group">
                    
                    {/* PRIMARY IDENTITY CELL */}
                    <td className="py-4 px-6 w-[30%] min-w-0">
                      <div className="flex flex-col space-y-0.5 truncate">
                        <span className="text-xs font-black text-foreground group-hover:text-brand-primary transition-colors">
                          {member.full_name}
                        </span>
                        <span className="text-[10px] text-muted/80 font-mono flex items-center gap-1">
                          <Mail size={10} className="opacity-50" />
                          {member.email}
                        </span>
                      </div>
                    </td>

                    {/* IDENTITY HASH ROW */}
                    <td className="py-4 px-4 w-[25%] font-mono text-[10px] text-muted/70">
                      <span className="bg-surface/60 border border-border/40 px-2 py-0.5 rounded-md select-all">
                        {member.id}
                      </span>
                    </td>

                    {/* ROLES BADGES ARRAY */}
                    <td className="py-4 px-4 w-[20%] select-none">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border font-mono ${getRoleBadgeStyle(member.role)}`}>
                        {member.role}
                      </span>
                    </td>

                    {/* TELEMETRY TOGGLE CONNECTION STATE */}
                    <td className="py-4 px-6 w-[25%] text-right select-none font-mono text-[10px]">
                      <div className="inline-flex items-center gap-1.5 font-bold">
                        {member.active ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
                            <span className="text-brand-accent uppercase text-[9px] tracking-wide">Active Node</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-muted/40" />
                            <span className="text-muted/60 uppercase text-[9px] tracking-wide">De-allocated</span>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* VIEWPORT METRIC REGULATORY FOOTER */}
      <div className="w-full bg-surface/20 px-6 py-4 border-t border-border/40 shrink-0 flex items-center justify-between text-[10px] font-mono font-bold text-muted select-none z-10">
        <div className="flex items-center gap-1.5">
          <UserCheck size={13} className="text-brand-accent" />
          <span>Operational Boundary: Authorized</span>
        </div>
        <div>
          <span>Total Records: <span className="text-foreground">{filteredStaff.length}</span> Matrix Rows</span>
        </div>
      </div>

    </div>
  );
}