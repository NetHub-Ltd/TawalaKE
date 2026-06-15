
// // app/(organization)/org/[organizationId]/[businessId]/layout.tsx
// import React from "react";
// import { Metadata } from "next";
// import { BusinessProvider } from "@/features/business/components/BusinessProvider";
// import { Sidebar } from "@/features/org/components/Sidebar";
// import { 
//   Building2, 
//   Search, 
//   Bell, 
//   MonitorCheck
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "Terminal | Sales Hub",
//   description: "High-performance POS interface for streamlined business operations.",
//   robots: "noindex, nofollow",
// };

// interface LayoutProps {
//   children: React.ReactNode;
//   params: Promise<{ businessId: string; organizationId: string }>;
// }

// export default async function TerminalLayout({
//   children,
//   params,
// }: LayoutProps) {
//   const { organizationId, businessId } = await params;

//   if (!businessId) {
//     return null;
//   }

//   const businessName = "Terminal Node";

//   return (
//     <BusinessProvider businessId={businessId} businessName={businessName} organizationId={organizationId}>
      
//       {/* MAIN APP SHELL: Force explicit flex-row axis arrangement */}
//       <div className="h-screen w-full flex flex-row bg-surface overflow-hidden select-none text-foreground transition-colors duration-300">
        
//         {/* FIXED LEFT SIDEBAR PANEL */}
//         <Sidebar businessId={businessId} organizationId={organizationId} />

//         {/* WORKSPACE COLUMN CONTENT STREAM: Stacks header and scrollable views vertically */}
//         <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-background">
          
//           {/* HIGH-PERFORMANCE FIXED TERMINAL HEADER */}
//           <header 
//             className="h-16 w-full flex items-center justify-between px-6 border-b border-border/40 bg-surface/50 backdrop-blur-md shrink-0 z-10"
//             aria-label="Terminal Application Control Bar"
//           >
//             {/* Left Context Zone */}
//             <div className="flex items-center gap-3 min-w-0">
//               <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0 border border-brand-accent/20">
//                 <MonitorCheck className="w-4 h-4" />
//               </div>
//               <div className="truncate">
//                 <h1 className="text-sm font-black uppercase tracking-tight text-foreground leading-none">
//                   {businessName}
//                 </h1>
//                 <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mt-0.5 font-mono">
//                   Active Station Matrix
//                 </span>
//               </div>
//             </div>

//             {/* Right Action/Telemetry Utilities Zone */}
//             <div className="flex items-center gap-4 shrink-0">
//               {/* Quick Terminal Live Search Mock Input */}
//               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/60 text-muted w-48 md:w-64 focus-within:border-brand-accent/40 transition-all">
//                 <Search className="w-3.5 h-3.5 text-muted/60" />
//                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted/50">Search Node...</span>
//               </div>

//               {/* Functional Notification Badge Target */}
//               <button className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-background border border-transparent hover:border-border/40 transition-all relative cursor-pointer">
//                 <Bell className="w-4 h-4" />
//                 <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
//               </button>
//             </div>
//           </header>

//           {/* INTERNAL ISOLATED CONTENT VIEWPORT */}
//           <main 
//             id="main-content" 
//             className="flex-1 min-w-0 min-h-0 relative bg-background"
//           >
//             {/* SCROLLABLE VIEWPORT FRAME:
//                 Only this container scrolls vertically when page children content expands.
//             */}
//             <div className="absolute inset-0 overflow-y-auto px-6 py-6 md:px-8 md:py-8 focus:outline-none">
//               {children}
//             </div>
//           </main>

//         </div>
//       </div>
//     </BusinessProvider>
//   );
// }

// app/(organization)/org/[organizationId]/[businessId]/layout.tsx
import React from "react";
import { Metadata } from "next";
import { BusinessProvider } from "@/features/business/components/BusinessProvider";
import { Sidebar } from "@/features/org/components/Sidebar";
import { 
  Search, 
  Bell, 
  MonitorCheck
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terminal | Sales Hub",
  description: "High-performance POS interface for streamlined business operations.",
  robots: "noindex, nofollow",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ businessId: string; organizationId: string }>;
}

export default async function TerminalLayout({
  children,
  params,
}: LayoutProps) {
  const { organizationId, businessId } = await params;

  if (!businessId) {
    return null;
  }

  const businessName = "Terminal Node";

  return (
    <BusinessProvider businessId={businessId} businessName={businessName} organizationId={organizationId}>
      
      {/* MAIN APP SHELL: Structural viewport mapping only */}
      <div className="h-screen w-full flex flex-row overflow-hidden select-none">
        
        {/* FIXED LEFT SIDEBAR PANEL */}
        <Sidebar businessId={businessId} organizationId={organizationId} />

        {/* WORKSPACE COLUMN CONTENT STREAM: Stacks header and scrollable viewports vertically */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          
          {/* HIGH-PERFORMANCE FIXED TERMINAL HEADER */}
          <header 
            className="h-16 w-full flex items-center justify-between px-6 border-b border-border/40 shrink-0 z-10"
            aria-label="Terminal Application Control Bar"
          >
            {/* Left Context Zone */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0 border border-brand-accent/20">
                <MonitorCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h1 className="text-sm font-black uppercase tracking-tight leading-none">
                  {businessName}
                </h1>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mt-0.5 font-mono">
                  Active Station Matrix
                </span>
              </div>
            </div>

            {/* Right Action/Telemetry Utilities Zone */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Quick Terminal Live Search Mock Input */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 text-muted w-48 md:w-64 focus-within:border-brand-accent/40 transition-all">
                <Search className="w-3.5 h-3.5 text-muted/60" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted/50">Search Node...</span>
              </div>

              {/* Functional Notification Badge Target */}
              <button className="p-2 text-muted hover:text-foreground rounded-xl border border-transparent hover:border-border/40 transition-all relative cursor-pointer">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
              </button>
            </div>
          </header>

          {/* INTERNAL ISOLATED CONTENT VIEWPORT */}
          <main 
            id="main-content" 
            className="flex-1 min-w-0 min-h-0 relative"
          >
            {/* SCROLLABLE VIEWPORT FRAME:
                Only this container scrolls vertically when page children content expands.
            */}
            <div className="absolute inset-0 overflow-y-auto px-6 py-6 md:px-8 md:py-8 focus:outline-none">
              {children}
            </div>
          </main>

        </div>
      </div>
    </BusinessProvider>
  );
}