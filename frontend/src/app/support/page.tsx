"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Smile,
  MessageCircle, 
  PhoneCall, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft,
  Heart,
  Loader2
} from "lucide-react";

export default function SupportPage() {
  const [formData, setFormData] = useState({ name: "", shopName: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    
    setIsSubmitting(true);
    // Simulate a reassuring, localized delivery connection sync
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <>
      {/* Screen-bounded template container protecting your macro layout: Absolutely zero scroll */}
      <main className="h-screen w-full bg-[#fafbfc] text-[#2d3142] overflow-hidden relative flex flex-col p-4 lg:p-8 selection:bg-primary/20">
        
        {/* Soft atmospheric background tones setting a visual calm rhythm */}
        <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] bg-[#f0f3ff] rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-[#fff0f2] rounded-full blur-[90px] pointer-events-none" aria-hidden="true" />

        {/* --- BRAND HEADER ZONE --- */}
        <header className="w-full flex items-center justify-between pb-5 border-b border-slate-100 shrink-0 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-primary">Tawala Companionship</span>
            <h1 className="text-lg font-black text-[#1e2229] uppercase tracking-tight">Care & Operations</h1>
          </div>
          <div>
            <Link 
              href="/terminal" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors p-2 bg-white border border-slate-100 rounded-xl shadow-soft"
            >
              <ArrowLeft size={13} /> Return to Dashboard
            </Link>
          </div>
        </header>

        {/* --- CORE TWO-COLUMN COMPANION INTERFACE --- */}
        <div id="main-content" className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6 relative z-10 outline-none">
          
          {/* LEFT PANEL: EMPATHETIC REASSURANCE CONTENT */}
          <section className="lg:col-span-5 flex flex-col space-y-6 justify-center min-h-0" aria-labelledby="support-heading">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit">
                <Smile size={13} className="text-primary" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  We are here for you
                </span>
              </div>
              <h2 id="support-heading" className="text-2xl xl:text-4xl font-black tracking-tight text-[#1e2229] leading-tight">
                Running a Store is Hard. <br />
                <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                  Getting Help Shouldn&apos;t Be.
                </span>
              </h2>
            </div>

            <p className="text-[#5c6479] text-xs xl:text-sm font-medium leading-relaxed max-w-md">
              Whether you have a question about calculating daily net sales profits, adjusting inventory stock alerts, or linking a new cashier device—our team listens carefully. Drop us a note here and we will reach out immediately.
            </p>

            {/* Direct Instant Action Links */}
            <div className="space-y-3 max-w-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Immediate Direct Access Routes:</p>
              
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-soft">
                <div className="h-9 w-9 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1e2229]">WhatsApp Quick Helpline</p>
                  <p className="text-[10px] font-medium text-emerald-600">Active Daily &bull; Best for Counter Issues</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-soft">
                <div className="h-9 w-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100">
                  <PhoneCall size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1e2229]">Call Priority Operator</p>
                  <p className="text-[10px] font-medium text-slate-400">Available for Enterprise Growth plans</p>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT PANEL: REASSURING INTERACTIVE SUBMISSION INTERFACE */}
          <section className="lg:col-span-7 flex items-center justify-center min-h-0 h-full max-h-[480px]" aria-label="Support message entry container">
            <div className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-100 shadow-soft p-6 md:p-8 flex flex-col justify-center relative overflow-hidden transition-all duration-300">
              
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#1e2229] uppercase tracking-tight">Send an Operational Message</h3>
                    <p className="text-[11px] font-medium text-[#7d859a]">Tell us exactly what is on your mind and we will handle it.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Kamau"
                        required
                        className="w-full h-11 px-4 bg-[#fafbfc] border border-slate-200/80 rounded-xl text-xs font-semibold text-[#2d3142] placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="shopName" className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Your Shop Name</label>
                      <input
                        type="text"
                        id="shopName"
                        value={formData.shopName}
                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                        placeholder="e.g., Crossroads Minimart"
                        className="w-full h-11 px-4 bg-[#fafbfc] border border-slate-200/80 rounded-xl text-xs font-semibold text-[#2d3142] placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">What can we simplify for you?</label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about any questions you have regarding your sales logs, stock balancing, or cashier entries..."
                      required
                      className="w-full p-4 bg-[#fafbfc] border border-slate-200/80 rounded-xl text-xs font-semibold text-[#2d3142] placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:bg-white transition-all resize-none no-scrollbar leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Notifying Local Care Operations...</span>
                      </>
                    ) : (
                      <span>Send Message to Support</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Beautiful human assurance state upon success */
                <div className="text-center space-y-4 py-6 animate-fadeIn">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 mx-auto shadow-sm">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-[#1e2229] uppercase tracking-tight">Message Received Safely</h3>
                    <p className="text-xs font-medium text-[#5c6479] max-w-sm mx-auto leading-relaxed">
                      Thank you, <span className="text-primary font-bold">{formData.name || "Partner"}</span>. Our local support channel has logged your updates for <span className="font-bold text-[#1e2229]">{formData.shopName || "your biashara"}</span>. We will reach out shortly.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={() => { setIsSuccess(false); setFormData({ name: "", shopName: "", message: "" }); }}
                      className="text-xs font-bold text-slate-400 hover:text-primary transition-colors underline underline-offset-4"
                    >
                      Send another note
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>

        </div>

        {/* --- SYSTEM PROTECTION FOOTER BAR --- */}
        <footer className="w-full flex items-center justify-between pt-4 border-t border-slate-100 shrink-0 text-[#7d859a] font-medium text-[11px] z-10">
          <div className="flex items-center gap-1.5">
            <Heart size={12} className="text-rose-400 fill-rose-400/20" />
            <span>Tawala Technology &copy; {new Date().getFullYear()}. Protecting your business peace of mind.</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-bold">
            <HelpCircle size={12} className="text-primary" />
            <span>Support Stream: Secure Encryption Active</span>
          </div>
        </footer>

      </main>
    </>
  );
}