"use client";

import React, { useState } from "react";

export default function ThemeTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <main className="bg-surface min-h-screen section-padding">
      
      {/* Toast Notification Notification Layer */}
      {toastMessage && (
        <div 
          role="alert" 
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-background border border-brand-primary rounded-[2rem] p-4 shadow-glow"
        >
          <span className="h-2 w-2 rounded-full bg-brand-accent" />
          <p className="text-base font-medium text-foreground">{toastMessage}</p>
        </div>
      )}

      {/* Main Dashboard Layout Container */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Module 1: Unified Header Platform Architecture */}
        <header className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-base font-bold uppercase tracking-widest text-brand-secondary">
              Environment Controls
            </span>
            <h1 className="text-h1 font-black text-gradient animate-gradient mt-1">
              System Sandbox
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => showNotification("Telemetry snapshot captured")}
              className="px-4 py-2.5 rounded-xl font-semibold text-foreground bg-background border border-border hover:border-brand-primary transition-all text-base"
            >
              Export Logs
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-semibold text-background bg-brand-primary hover:bg-brand-secondary transition-all text-base"
            >
              Initialize Cluster
            </button>
          </div>
        </header>

        {/* Module 2: Metric Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Key Performance Indicators">
          <div className="card-layered p-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-muted">Core Engine Status</h3>
            <p className="text-h2 mt-2 font-black text-brand-accent">99.98%</p>
            <p className="text-base text-muted mt-1">Operational across all localized regions</p>
          </div>
          <div className="card-layered p-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-muted">Active Node Count</h3>
            <p className="text-h2 mt-2 font-black text-foreground">1,420</p>
            <p className="text-base text-muted mt-1">Memory management matrices stable</p>
          </div>
          <div className="card-layered p-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-muted">System Throughput</h3>
            <p className="text-h2 mt-2 font-black text-brand-primary">4.2 GB/s</p>
            <p className="text-base text-muted mt-1">Peak network saturation threshold</p>
          </div>
        </section>

        {/* Module 3: Dual Column Management Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Column A: Configuration Console */}
          <section className="card-layered p-8 lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-h3">Node Setup</h2>
              <p className="text-base text-muted mt-1">Modify instance environmental parameters.</p>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); showNotification("Parameters updated successfully"); }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-base font-semibold text-muted mb-2">Instance Identifier</label>
                <input 
                  type="text" 
                  required
                  placeholder="us-east-cluster-01" 
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-base focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-muted mb-2">Routing Mode</label>
                <select className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-base focus:outline-none focus:border-brand-primary">
                  <option>Latency-Optimized (Edge)</option>
                  <option>Cost-Efficient (Cold Storage)</option>
                  <option>High-Availability (Multi-Region)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="telemetry"
                  className="h-4 w-4 border-border rounded text-brand-primary bg-surface"
                />
                <label htmlFor="telemetry" className="text-base text-muted selection:bg-transparent">
                  Enable continuous health checks
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-background font-bold rounded-xl transition-all text-base"
              >
                Apply Configuration
              </button>
            </form>
          </section>

          {/* Column B: Primary Workspace & Micro-Ledger */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Database & Resource Matrix */}
            <section className="card-layered p-8">
              <h2 className="text-h3 mb-4">Resource Matrix</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-base text-muted font-bold">
                      <th className="pb-3 font-semibold">Service Registry</th>
                      <th className="pb-3 font-semibold">Operational Metric</th>
                      <th className="pb-3 font-semibold text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="text-base divide-y divide-border text-foreground">
                    <tr>
                      <td className="py-4 font-medium">Gateway Authentication API</td>
                      <td className="py-4 text-muted">14.2 ms avg latency</td>
                      <td className="py-4 text-right"><span className="text-brand-accent font-bold">Active</span></td>
                    </tr>
                    <tr>
                      <td className="py-4 font-medium">Distributed Cache Engine</td>
                      <td className="py-4 text-muted">98.4% hit ratio</td>
                      <td className="py-4 text-right"><span className="text-brand-accent font-bold">Active</span></td>
                    </tr>
                    <tr>
                      <td className="py-4 font-medium">Relational Database Core</td>
                      <td className="py-4 text-muted">Scheduled Backup pending</td>
                      <td className="py-4 text-right"><span className="text-brand-secondary font-bold">Maintenance</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Financial Ledger Block */}
            <section className="card-layered p-8 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-h3">Account Ledger Summary</h2>
                  <p className="text-base text-muted mt-1">Billing period cycle identifier: Ref-2026-X90</p>
                </div>
                <span className="text-base font-bold text-brand-primary uppercase tracking-wider bg-surface px-3 py-1 border border-border rounded-xl">
                  Settled
                </span>
              </div>

              <div className="space-y-3 border-t border-b border-border py-4 my-4 text-base text-muted">
                <div className="flex justify-between">
                  <span>Enterprise Infrastructure Node Tier</span>
                  <span className="text-foreground font-medium">$499.00</span>
                </div>
                <div className="flex justify-between">
                  <span>High-Capacity Database Allocation Add-on</span>
                  <span className="text-foreground font-medium">$150.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-foreground">Aggregated Subtotal</span>
                <span className="text-h3 font-black text-brand-primary">$649.00</span>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Structural Context Interrupt Component (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface bg-opacity-80 backdrop-blur-sm p-4">
          <div className="bg-background border border-border max-w-lg w-full p-8 rounded-[2rem] shadow-glow space-y-6">
            <div>
              <h3 className="text-h3 text-foreground">Confirm Cluster Deployment</h3>
              <p className="text-base text-muted mt-2">
                This operation provisions fresh virtualization instances across secondary regions. Network configurations will sync instantly.
              </p>
            </div>
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-surface text-base transition-all"
              >
                Cancel Execution
              </button>
              <button 
                onClick={() => { setIsModalOpen(false); showNotification("Cluster pipeline successfully deployed."); }}
                className="px-5 py-2.5 rounded-xl bg-brand-primary text-background font-bold hover:bg-brand-secondary text-base transition-all"
              >
                Confirm System Build
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}