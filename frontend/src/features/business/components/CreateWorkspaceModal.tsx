// "use client";

// import { useState } from "react";
// import { Plus, X, Loader2 } from "lucide-react";
// import { useBusiness } from "@/features/business/hooks/useBusiness";

// export function CreateWorkspaceModal() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [newName, setNewName] = useState("");
//   const { register: registerBusiness, isRegistering } = useBusiness();

//   const handleRegister = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newName.trim() || isRegistering) return;

//     registerBusiness(newName, {
//       onSuccess: () => {
//         setNewName("");
//         setIsOpen(false);
//       },
//     });
//   };

//   return (
//     <>
//       {/* TRIGGER BUTTON */}
//       <button
//         onClick={() => setIsOpen(true)}
//         className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[200px] w-full"
//       >
//         <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
//           <Plus size={24} />
//         </div>
//         <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-primary">
//           Add Workspace
//         </span>
//       </button>

//       {/* PORTAL OVERLAY */}
//       {isOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-200">
//             <div className="px-8 pt-8 pb-6 flex justify-between items-center">
//               <h3 className="font-black uppercase tracking-tight text-xl">
//                 New <span className="text-primary">Workspace</span>
//               </h3>
//               <button
//                 onClick={() => setIsOpen(false)}
//                 className="p-2 hover:bg-slate-100 rounded-full transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleRegister} className="px-8 pb-10 space-y-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
//                   Legal Entity Name
//                 </label>
//                 <input
//                   autoFocus
//                   type="text"
//                   placeholder="e.g. Scribe Logistics Ltd"
//                   value={newName}
//                   onChange={(e) => setNewName(e.target.value)}
//                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={isRegistering || !newName.trim()}
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
//     </>
//   );
// }

"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useBusiness } from "@/features/business/hooks/useBusiness";

export default function CreateWorkspaceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const { register: registerBusiness, isRegistering } = useBusiness();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isRegistering) return;

    registerBusiness(newName, {
      onSuccess: () => {
        setNewName("");
        setIsOpen(false);
      },
    });
  };

  return (
    <>
      {/* Dashed Add Card Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[200px] w-full text-center outline-none focus:ring-4 focus:ring-primary/5"
      >
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
          <Plus size={24} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-primary">
          Add Workspace
        </span>
      </button>

      {/* Backdrop & Overlay Portal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-6 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight text-xl">
                New <span className="text-primary">Workspace</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="px-8 pb-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Legal Entity Name
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Scribe Logistics Ltd"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering || !newName.trim()}
                className="w-full bg-slate-900 text-white dark:bg-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRegistering ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Initializing Node...
                  </>
                ) : (
                  "Deploy Workspace"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}