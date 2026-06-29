
// "use client";

// import React, { useState, useMemo } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { useStaff } from "@/features/staff/hooks/useStaff";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { 
//   UserPlus, 
//   RefreshCw, 
//   Mail, 
//   Search, 
//   Loader2, 
//   AlertCircle,
//   Users,
//   ShieldCheck,
//   Eye,
//   EyeOff
// } from "lucide-react";

// // Basic Password Policy Validation Schema
// const passwordSchema = z.string()
//   .min(8, "Password must be at least 8 characters long")
//   .regex(/[A-Z]/, "Requires at least one uppercase letter")
//   .regex(/[a-z]/, "Requires at least one lowercase letter")
//   .regex(/[0-9]/, "Requires at least one number")
//   .regex(/[^A-Za-z0-9]/, "Requires at least one special character");

// const staffFormSchema = z.object({
//   email: z.string().email("Please enter a valid email address"),
//   full_name: z.string().min(2, "Full name must be at least 2 characters"),
//   password: passwordSchema,
//   role: z.enum(["OWNER"]),
// });

// type StaffFormValues = z.infer<typeof staffFormSchema>;

// export default function StaffWorkspace() {
//   const { businessId, organizationId } = useBusinessContext();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [roleFilter, setRoleFilter] = useState("ALL");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isSubmittingForm, setIsSubmittingForm] = useState(false);

//   const normalizedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId || "";
//   const normalizedBusinessId = Array.isArray(businessId) ? businessId[0] : businessId || "";

//   const { staff = [], isLoading, isFetching, isError, error, refetch } = useStaff(normalizedOrgId);

//   // Initialize React Hook Form
//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<StaffFormValues>({
//     resolver: zodResolver(staffFormSchema),
//     defaultValues: {
//       role: "CASHIER",
//       full_name: "",
//       email: "",
//       password: "",
//     },
//   });

//   // Filter staff entries locally
//   const filteredStaff = useMemo(() => {
//     return staff.filter((member) => {
//       const matchesSearch = 
//         member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         member.email.toLowerCase().includes(searchTerm.toLowerCase());
      
//       const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
//       return matchesSearch && matchesRole;
//     });
//   }, [staff, searchTerm, roleFilter]);

//   // Unified form submission mapping to your required payload shape
//   const onSubmit = async (data: StaffFormValues) => {
//     setIsSubmittingForm(true);
//     try {
//       const payload = {
//         tenant_id: normalizedOrgId,         // Maps tenant_id to organization_id context
//         business_id: normalizedBusinessId,
//         email: data.email,
//         full_name: data.full_name,
//         password: data.password,
//         role: data.role,
//       };

//       console.log("Submitting dynamic payload structure:", payload);
      
//       // Execute your API mutation logic here
//       await createStaffMutation(payload);
      
//       reset(); // Clear form inputs on success
//     } catch (err) {
//       console.error("Failed to provision new staff member:", err);
//     } finally {
//       setIsSubmittingForm(false);
//     }
//   };

//   const getRoleBadgeStyle = (role: string) => {
//     switch (role) {
//       case "OWNER": return "bg-rose-50 text-rose-700 border-rose-200";
//       case "ADMIN": return "bg-indigo-55 text-indigo-700 border-indigo-200";
//       case "MANAGER": return "bg-cyan-50 text-cyan-700 border-cyan-200";
//       case "CASHIER": return "bg-emerald-50 text-emerald-700 border-emerald-200";
//       default: return "bg-slate-50 text-slate-700 border-slate-200";
//     }
//   };

//   return (
//     <div className="w-full h-full p-6 bg-slate-50/50 min-h-screen">
//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
        
//         {/* LEFT/CENTER AREA: STAFF DIRECTORY */}
//         <div className="xl:col-span-2 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
//           {/* Header Controls */}
//           <div className="p-6 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
//                 <Users size={18} className="text-indigo-600" />
//                 Staff Directory
//               </h1>
//               <p className="text-xs text-slate-500 mt-0.5">
//                 Active team assignments for Business ID: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[11px] font-medium">{normalizedBusinessId}</span>
//               </p>
//             </div>

//             <div className="flex flex-wrap items-center gap-2">
//               <div className="relative min-w-[200px]">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//                 <input
//                   type="text"
//                   placeholder="Search name or email..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
//                 />
//               </div>

//               <select
//                 value={roleFilter}
//                 onChange={(e) => setRoleFilter(e.target.value)}
//                 className="h-9 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
//               >
//                 <option value="ALL">All Roles</option>
//                 <option value="OWNER">Owner</option>
//                 <option value="ADMIN">Admin</option>
//                 <option value="MANAGER">Manager</option>
//                 <option value="CASHIER">Cashier</option>
//                 <option value="OPERATOR">Operator</option>
//               </select>

//               <button
//                 type="button"
//                 onClick={() => refetch()}
//                 disabled={isLoading || isFetching}
//                 className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-all text-slate-600 disabled:opacity-50"
//                 title="Refresh List"
//               >
//                 <RefreshCw size={14} className={isFetching ? "animate-spin text-indigo-600" : ""} />
//               </button>
//             </div>
//           </div>

//           {/* Table Container */}
//           <div className="flex-1 overflow-x-auto min-h-[400px] relative">
//             {isLoading ? (
//               <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
//                 <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
//                 <p className="text-xs text-slate-500 font-medium">Loading staff records...</p>
//               </div>
//             ) : isError ? (
//               <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
//                 <AlertCircle className="text-rose-500 mb-2" size={24} />
//                 <p className="text-xs font-semibold text-slate-900">Failed to load system staff</p>
//                 <p className="text-[11px] text-slate-500 font-mono mt-1">{error?.message || "Internal Connection Error"}</p>
//               </div>
//             ) : filteredStaff.length === 0 ? (
//               <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
//                 <Users className="text-slate-300 mb-2" size={28} />
//                 <p className="text-xs font-semibold text-slate-700">No matching records found</p>
//                 <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Try adjusting your query strings or filters.</p>
//               </div>
//             ) : (
//               <table className="w-full border-collapse text-left table-fixed min-w-[600px]">
//                 <thead>
//                   <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-200 select-none">
//                     <th className="py-3 px-6 w-[45%]">Staff Member</th>
//                     <th className="py-3 px-4 w-[25%]">Role Profile</th>
//                     <th className="py-3 px-6 w-[30%] text-right">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
//                   {filteredStaff.map((member) => (
//                     <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
//                       <td className="py-4 px-6 truncate">
//                         <div className="flex flex-col truncate">
//                           <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
//                             {member.full_name}
//                           </span>
//                           <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
//                             <Mail size={12} className="opacity-70" />
//                             {member.email}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="py-4 px-4 select-none">
//                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${getRoleBadgeStyle(member.role)}`}>
//                           {member.role}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6 text-right select-none">
//                         <div className="inline-flex items-center gap-1.5 font-medium">
//                           <span className={`h-1.5 w-1.5 rounded-full ${member.active ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
//                           <span className={member.active ? "text-emerald-700 font-medium" : "text-slate-400"}>
//                             {member.active ? "Active" : "Inactive"}
//                           </span>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>

//         {/* RIGHT AREA: CLEAN MINIMAL RHF CREATION PANEL */}
//         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-fit">
//           <div className="mb-5">
//             <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
//               <UserPlus size={18} className="text-indigo-600" />
//               Add New Staff Member
//             </h2>
//             <p className="text-xs text-slate-500 mt-0.5">
//               Provision credential configurations straight to this client container block.
//             </p>
//           </div>

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//             {/* Full Name */}
//             <div className="space-y-1">
//               <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Full Name</label>
//               <input
//                 type="text"
//                 {...register("full_name")}
//                 className={`w-full h-9 px-3 bg-slate-50 border ${errors.full_name ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"} rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all`}
//                 placeholder="e.g. John Doe"
//               />
//               {errors.full_name && (
//                 <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
//                   {errors.full_name.message}
//                 </p>
//               )}
//             </div>

//             {/* Email Address */}
//             <div className="space-y-1">
//               <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Email Address</label>
//               <input
//                 type="email"
//                 {...register("email")}
//                 className={`w-full h-9 px-3 bg-slate-50 border ${errors.email ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"} rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all`}
//                 placeholder="name@company.com"
//               />
//               {errors.email && (
//                 <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
//                   {errors.email.message}
//                 </p>
//               )}
//             </div>

//             {/* Role Dropdown Selector */}
//             <div className="space-y-1">
//               <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Access Role</label>
//               <select
//                 {...register("role")}
//                 className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer focus:bg-white"
//               >
//                 <option value="CASHIER">Cashier</option>
//                 <option value="OPERATOR">Operator</option>
//                 <option value="MANAGER">Manager</option>
//                 <option value="ADMIN">Admin</option>
//                 <option value="OWNER">Owner</option>
//               </select>
//             </div>

//             {/* Password Policy Input */}
//             <div className="space-y-1">
//               <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">System Password</label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   {...register("password")}
//                   className={`w-full h-9 pl-3 pr-9 bg-slate-50 border ${errors.password ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"} rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all`}
//                   placeholder="••••••••"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
//                 </button>
//               </div>
              
//               {/* Informative Error Block */}
//               {errors.password ? (
//                 <p className="text-[11px] text-rose-600 font-medium leading-relaxed mt-1">
//                   {errors.password.message}
//                 </p>
//               ) : (
//                 <p className="text-[10px] text-slate-400 leading-normal mt-1">
//                   Must be ≥ 8 chars with uppercase, lowercase, numbers, and special symbols.
//                 </p>
//               )}
//             </div>

//             {/* Submit Action Button */}
//             <button
//               type="submit"
//               disabled={isSubmittingForm}
//               className="w-full h-10 mt-2 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 select-none shadow-xs cursor-pointer"
//             >
//               {isSubmittingForm ? (
//                 <Loader2 className="animate-spin" size={14} />
//               ) : (
//                 <ShieldCheck size={14} />
//               )}
//               <span>Create Account</span>
//             </button>
//           </form>
//         </div>

//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStaff, useRegisterStaff } from "@/features/staff/hooks/useStaff";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { 
  UserPlus, 
  RefreshCw, 
  Mail, 
  Search, 
  Loader2, 
  AlertCircle,
  Users,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

// Basic Password Policy Validation Schema
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Requires at least one uppercase letter")
  .regex(/[a-z]/, "Requires at least one lowercase letter")
  .regex(/[0-9]/, "Requires at least one number")
  .regex(/[^A-Za-z0-9]/, "Requires at least one special character");

const staffFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  password: passwordSchema,
  role: z.enum(["CASHIER", "OPERATOR", "MANAGER", "ADMIN", "OWNER"]),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function StaffWorkspace() {
  const { businessId, organizationId } = useBusinessContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showPassword, setShowPassword] = useState(false);

  const normalizedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId || "";
  const normalizedBusinessId = Array.isArray(businessId) ? businessId[0] : businessId || "";

  // 1. Data Fetching Hook
  const { staff = [], isLoading, isFetching, isError, error, refetch } = useStaff(normalizedOrgId);

  // 2. Data Mutation Hook for registration
  const { mutateAsync: registerStaff, isPending: isSubmittingForm, error: mutationError } = useRegisterStaff(normalizedOrgId);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      role: "CASHIER",
      full_name: "",
      email: "",
      password: "",
    },
  });

  // Filter staff entries locally
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch = 
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, searchTerm, roleFilter]);

  // Unified form submission mapping to your required payload shape
  const onSubmit = async (data: StaffFormValues) => {
    try {
      // Execute TanStack Query mutation with your exact payload shape
      await registerStaff({
        tenant_id: normalizedOrgId,         // tenant_id requested
        // organization_id: normalizedOrgId,   // organization_id context
        business_id: normalizedBusinessId,  // business_id requested
        email: data.email,
        full_name: data.full_name,
        role: data.role as any,             // Cast to match hook's expected roles                   // Automatically provision as active
        // Note: Include password if your backend endpoint consumes it natively inside this layout block
        ...({ password: data.password })
      } as any);
      
      reset(); // Clear form fields on successful API response
    } catch (err) {
      // Handled directly by TanStack Query's error response mapping
      console.error("Mutation submission failure:", err);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "OWNER": return "bg-rose-50 text-rose-700 border-rose-200";
      case "ADMIN": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "MANAGER": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "CASHIER": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="w-full h-full p-6 bg-slate-50/50 min-h-screen">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
        
        {/* LEFT/CENTER AREA: STAFF DIRECTORY */}
        <div className="xl:col-span-2 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Header Controls */}
          <div className="p-6 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
                <Users size={18} className="text-indigo-600" />
                Staff Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Active team assignments for Business ID: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[11px] font-medium">{normalizedBusinessId}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Cashier</option>
                <option value="OPERATOR">Operator</option>
              </select>

              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
                className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-all text-slate-600 disabled:opacity-50"
                title="Refresh List"
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin text-indigo-600" : ""} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto min-h-[400px] relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
                <p className="text-xs text-slate-500 font-medium">Loading staff records...</p>
              </div>
            ) : isError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="text-rose-500 mb-2" size={24} />
                <p className="text-xs font-semibold text-slate-900">Failed to load system staff</p>
                <p className="text-[11px] text-slate-500 font-mono mt-1">{error?.message || "Internal Connection Error"}</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <Users className="text-slate-300 mb-2" size={28} />
                <p className="text-xs font-semibold text-slate-700">No matching records found</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Try adjusting your query strings or filters.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left table-fixed min-w-[600px]">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-200 select-none">
                    <th className="py-3 px-6 w-[45%]">Staff Member</th>
                    <th className="py-3 px-4 w-[25%]">Role Profile</th>
                    <th className="py-3 px-6 w-[30%] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 truncate">
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {member.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail size={12} className="opacity-70" />
                            {member.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 select-none">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${getRoleBadgeStyle(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right select-none">
                        <div className="inline-flex items-center gap-1.5 font-medium">
                          <span className={`h-1.5 w-1.5 rounded-full ${member.active ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                          <span className={member.active ? "text-emerald-700 font-medium" : "text-slate-400"}>
                            {member.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT AREA: CLEAN MINIMAL RHF CREATION PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-fit">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
              <UserPlus size={18} className="text-indigo-600" />
              Add New Staff Member
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Provision credential configurations straight to this client container block.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                {...register("full_name")}
                className={`w-full h-9 px-3 bg-slate-50 border ${errors.full_name ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"} rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all`}
                placeholder="e.g. John Doe"
              />
              {errors.full_name && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                {...register("email")}
                className={`w-full h-9 px-3 bg-slate-50 border ${errors.email ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"} rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all`}
                placeholder="name@company.com"
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Role Dropdown Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Access Role</label>
              <select
                {...register("role")}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer focus:bg-white"
              >
                <option value="CASHIER">Cashier</option>
                <option value="OPERATOR">Operator</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>

            {/* Password Policy Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">System Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full h-9 pl-3 pr-9 bg-slate-50 border ${errors.password ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"} rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:bg-white transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              
              {/* Informative Error Block */}
              {errors.password ? (
                <p className="text-[11px] text-rose-600 font-medium leading-relaxed mt-1">
                  {errors.password.message}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 leading-normal mt-1">
                  Must be ≥ 8 chars with uppercase, lowercase, numbers, and special symbols.
                </p>
              )}
            </div>

            {/* API Mutation Error Alert Panel */}
            {mutationError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-rose-700 text-xs font-medium">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p className="m-0 leading-normal">{mutationError.message}</p>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmittingForm}
              className="w-full h-10 mt-2 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 select-none shadow-xs cursor-pointer"
            >
              {isSubmittingForm ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <ShieldCheck size={14} />
              )}
              <span>Create Account</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}