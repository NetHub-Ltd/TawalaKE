// "use client";
// import CreateWorkspaceModal from "@/features/business/components/CreateWorkspaceModal";
// import { useState } from "react";
// import {
//   Building2,
//   ChevronRight,
//   Lock,
//   Loader2,
//   Plus,
//   X,
//   Search,
//   LayoutGrid,
// } from "lucide-react";
// import Link from "next/link";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { useTenantProfile } from "@/features/auth/hooks/useTenant";
// import { useBusiness } from "@/features/business/hooks/useBusiness";

// export default function TerminalSwitchboard() {
//   const { data: user, isLoading: isLoadingProfile } = useTenantProfile();
//   const {
//     businesses,
//     isLoading: isLoadingBusinesses,
//     register: registerBusiness, // Renamed for clarity
//     isRegistering,
//   } = useBusiness();

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [newBusinessName, setNewBusinessName] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");

//   const filteredBusinesses = businesses.filter((b) =>
//     b.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const handleRegister = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newBusinessName.trim() || isRegistering) return;

//     registerBusiness(newBusinessName, {
//       onSuccess: () => {
//         setNewBusinessName("");
//         setIsModalOpen(false);
//       },
//     });
//   };

//   return (
//     <section className="h-screen w-full flex flex-col bg-[#F8F9FC] overflow-hidden selection:bg-primary/30">
//       <main className="flex-1 w-full mx-auto flex flex-col pt-12 px-6 overflow-hidden">
//         {/* HERO SECTION */}
//         <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
//           <div className="space-y-2">
//             <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
//               <LayoutGrid size={14} /> Workspace Selector
//             </div>
//             <h2 className="font-black tracking-tighter uppercase text-slate-900">
//               Business <span className="text-primary">Terminal</span>
//             </h2>
//             <p className="text-slate-500 font-medium max-w-md">
//               Select an operational environment to manage inventory and sales.
//             </p>
//           </div>

//           <div className="relative w-full md:w-80">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//             <input
//               type="text"
//               placeholder="Search workspaces..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
//             />
//           </div>
//         </div>

//         {/* WORKSPACE GRID */}
//         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-32">
//           {isLoadingBusinesses ? (
//             <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2rem] border border-dashed border-gray-200">
//               <Loader2 className="animate-spin text-primary mb-4" size={32} />
//               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Assets...</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//               {filteredBusinesses.map((biz) => (
//                 <Link
//                   key={biz.id}
//                   href={biz.active ? `/terminal/${biz.id}` : "#"}
//                   className={cn(
//                     "group relative flex flex-col p-6 rounded-[2rem] transition-all duration-300 bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/30",
//                     !biz.active && "opacity-50 grayscale cursor-not-allowed"
//                   )}
//                 >
//                   <div className="flex justify-between items-start mb-8">
//                     <div className={cn(
//                       "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
//                       biz.active ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : "bg-slate-100 text-slate-400"
//                     )}>
//                       {biz.active ? <Building2 size={28} /> : <Lock size={28} />}
//                     </div>
//                     <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{biz.name}</h3>
//                     <div className="flex items-center gap-3 mt-2">
//                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {biz.id.substring(0, 5)}</span>
//                       <span className="h-1 w-1 rounded-full bg-slate-200" />
//                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
//                         {format(new Date(biz.created_at), "MMM yyyy")}
//                       </span>
//                     </div>
//                   </div>
//                 </Link>
//               ))}

//               <button
//                 onClick={() => setIsModalOpen(true)}
//                 className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[200px]"
//               >
//                 <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
//                   <Plus size={24} />
//                 </div>
//                 <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-primary">Add Workspace</span>
//               </button>
//             </div>
//           )}
//         </div>
//       </main>

//       {/* REGISTRATION MODAL */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-200">
//             <div className="px-8 pt-8 pb-6 flex justify-between items-center">
//               <h3 className="font-black uppercase tracking-tight text-xl">New <span className="text-primary">Workspace</span></h3>
//               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
//                 <X size={20} />
//               </button>
//             </div>
            
//             <form onSubmit={handleRegister} className="px-8 pb-10 space-y-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Entity Name</label>
//                 <input
//                   autoFocus
//                   type="text"
//                   placeholder="e.g. Scribe Logistics Ltd"
//                   value={newBusinessName}
//                   onChange={(e) => setNewBusinessName(e.target.value)}
//                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={isRegistering || !newBusinessName.trim()}
//                 className="w-full bg-slate-900 text-white dark:bg-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//               >
//                 {isRegistering ? (
//                   <>
//                     <Loader2 size={16} className="animate-spin" />
//                     Initializing Node...
//                   </>
//                 ) : (
//                   "Deploy Workspace"
//                 )}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }

"use client";

import { useState } from "react";
import {
  Building2,
  ChevronRight,
  Lock,
  Loader2,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTenantProfile } from "@/features/auth/hooks/useTenant";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import CreateWorkspaceModal from "@/features/business/components/CreateWorkspaceModal";

export default function TerminalSwitchboard() {
  const { data: user, isLoading: isLoadingProfile } = useTenantProfile();
  const { businesses, isLoading: isLoadingBusinesses } = useBusiness();

  return (
    <section className="h-screen w-full flex flex-col bg-[#F8F9FC] overflow-hidden selection:bg-primary/30">
      <main className="flex-1 w-full mx-auto flex flex-col pt-12 px-6 overflow-hidden">
        
        {/* HERO SECTION */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
              <LayoutGrid size={14} /> Workspace Selector
            </div>
            <h2 className="font-black tracking-tighter uppercase text-slate-900">
              Business <span className="text-primary">Terminal</span>
            </h2>
            <p className="text-slate-500 font-medium max-w-md">
              Select an operational environment to manage inventory and sales.
            </p>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-32">
          {isLoadingBusinesses ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2rem] border border-dashed border-gray-200">
              <Loader2 className="animate-spin text-primary mb-4" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Syncing Assets...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={biz.active ? `/terminal/${biz.id}/${encodeURIComponent(biz.name)}` : "#"}
                  className={cn(
                    "group relative flex flex-col p-6 rounded-[2rem] transition-all duration-300 bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/30",
                    !biz.active && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                      biz.active ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {biz.active ? <Building2 size={28} /> : <Lock size={28} />}
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">
                      {biz.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        ID: {biz.id.substring(0, 5)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {format(new Date(biz.created_at), "MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* INTEGRATED SELF-CONTAINED CLIENT MODAL ISLAND */}
              <CreateWorkspaceModal />
            </div>
          )}
        </div>
      </main>
    </section>
  );
}