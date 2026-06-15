'use client'
import React from 'react'
import { useTenantProfile } from '@/features/auth/hooks/useTenant'

const DashboardPage = () => {
  // Extracting the real profile data hook you provided
  const { data: profile, isLoading } = useTenantProfile()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500 animate-pulse">Loading your biashara...</p>
      </div>
    )
  }

  // Fallback defaults if profile loading behaves unexpectedly
  const user_name = profile?.full_name || 'Mwenyewe'
  const role = profile?.role || 'OWNER'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* 1. Header / Welcome Banner */}
      <header className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sasa, {user_name}!
            </h1>
            <p className="text-sm text-slate-500">
              Here is what is happening across your biashara today.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Logged in as {role}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-8">
        {/* 2. Core Operational Metrics (MVP Scope) */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Sales Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Today&apos;s Sales</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">KES 0.00</h3>
            <p className="mt-1 text-xs text-emerald-600 font-medium">↑ 0% from yesterday</p>
          </div>

          {/* Transactions Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Transactions Passed</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">0</h3>
            <p className="mt-1 text-xs text-slate-500">Waiting for counter sales</p>
          </div>

          {/* Active Branches / Businesses */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Shops</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">1</h3>
            <p className="mt-1 text-xs text-slate-500 truncate">ID: ...{profile?.business_id?.substring(0, 8)}</p>
          </div>

          {/* Outstanding Balances */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Customer Balances</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">KES 0.00</h3>
            <p className="mt-1 text-xs text-amber-600 font-medium">Unpaid customer ledgers</p>
          </div>
        </section>

        {/* 3. Quick Actions — One Primary Action Pathway */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-400">Quick Shortcuts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="flex flex-col items-start gap-1 rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 text-left transition hover:bg-indigo-50 border-l-4 border-l-indigo-600">
              <span className="font-semibold text-indigo-900">Open Counter POS</span>
              <span className="text-xs text-indigo-600/80">Make a quick cash or M-Pesa sale immediately.</span>
            </button>

            <button className="flex flex-col items-start gap-1 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 text-left transition hover:bg-emerald-50 border-l-4 border-l-emerald-600">
              <span className="font-semibold text-emerald-900">Add New Product</span>
              <span className="text-xs text-emerald-600/80">Stock up items, update retail prices, and catalogs.</span>
            </button>

            <button className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:bg-slate-50 border-l-4 border-l-slate-700">
              <span className="font-semibold text-slate-900">Manage Counter Staff</span>
              <span className="text-xs text-slate-500">Invite workers and assign quick 4-digit checkout PINs.</span>
            </button>
          </div>
        </section>

        {/* 4. Activity Placeholder Area */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Recent Transactions Ledger</h3>
          </div>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              {/* Simple inline SVG receipt icon to keep it light */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-900">No transactions recorded today</p>
            <p className="mt-1 text-xs text-slate-400">When your counter staff sell items or process bills, they will appear here live.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage