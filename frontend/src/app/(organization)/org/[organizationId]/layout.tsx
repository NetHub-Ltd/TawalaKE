
// import React from 'react';
// import type { Metadata } from 'next';
// import { redirect } from 'next/navigation';
// import { Sidebar } from '@/features/org/components/Sidebar';

// // 3. Technical SEO Mandate: Metadata configuration for the workspace root layer
// export const metadata: Metadata = {
//   title: 'Workspace | Tawala Business Management System',
//   description: 'Manage sales, stock, staff, and customer ledgers across your businesses from your centralized Tawala dashboard.',
//   alternates: {
//     canonical: 'https://tawala.co.ke/org',
//   },
//   robots: {
//     index: false, // Security constraint: Never index private multi-tenant workspace dashboards
//     follow: false,
//   },
// };

// interface LayoutParams {
//   organizationId: string;
// }

// interface OrganizationRootLayoutProps {
//   children: React.ReactNode;
//   params: Promise<LayoutParams>;
// }

// // Mock interface representing your Python database schema representation for businesses
// interface BusinessNode {
//   id: string;
//   name: string;
//   isActive: boolean;
// }

// /**
//  * 3. Performance Mandate: Server-side data fetch isolation
//  * This executes directly on your node runtime environment. It interfaces cleanly with
//  * backend service endpoints without leaking sensitive network layer routes to the client browser.
//  */
// async function fetchOrganizationBusinesses(organizationId: string): Promise<BusinessNode[]> {
//   try {
//     // In production, replace with your internal service URL pointing to your Python FastAPI gateway
//     const response = await fetch(`/api/v1/org/stores`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       // next: { 
//       //   revalidate: 300, // Cache business list metadata for 5 minutes to optimize downstream database execution times
//       //   tags: [`org-businesses-${organizationId}`] 
//       // }
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch business infrastructure context for organization: ${organizationId}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Data Hydration Error:", error);
//     // Graceful degrading fallback matrix if backend services are temporarily unreachable
//     return [
//       { id: "biz_node_dev_01ac", name: "Tawala Node Alpha", isActive: true }
//     ];
//   }
// }

// export default async function OrganizationRootLayout({ 
//   children, 
//   params 
// }: OrganizationRootLayoutProps) {
  
//   // Resolve dynamic organization ID path parameters cleanly via modern Next.js async API mapping
//   const resolvedParams = await params;
//   const organizationId = resolvedParams.organizationId;

//   // Execute internal database fetch prior to any HTML compilation passes
//   const businesses = await fetchOrganizationBusinesses(organizationId);

//   /**
//    * 5. Transactional / Revenue Blueprint Logic:
//    * Evaluate if a valid store destination is active. If the user owns multiple stores,
//    * we choose the primary/first active store context to inject into our UI props.
//    * If zero matching business stores exist, safely redirect to a creation initialization workspace.
//    */
//   const primaryBusiness = businesses.find(b => b.isActive) || businesses[0];
  
//   if (!primaryBusiness) {
//     redirect(`/org/${organizationId}/setup-business`);
//   }

//   const activeBusinessId = primaryBusiness.id;

//   // 3. Technical SEO Mandate: Inject Structured Data (JSON-LD) for administrative portal orientation
//   const jsonLd = {
//     '@context': 'https://schema.org',
//     '@type': 'WebApplication',
//     'name': 'Tawala Business Management System',
//     'applicationCategory': 'BusinessApplication',
//     'operatingSystem': 'All',
//     'browserRequirements': 'Requires JavaScript. Requires HTML5.',
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       {/* 2. Core Development Principles: Outer container viewport lock to prevent double scrollbars */}
//       <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
        
//         {/* Dynamic context sidebar initialized safely with real server-resolved database IDs */}
//         <Sidebar 
//           organizationId={organizationId} 
//           businessId={activeBusinessId} 
//         />

//         {/* Unified workspace layout right pane */}
//         <div className="flex flex-1 flex-col overflow-hidden bg-slate-900">
          
//           {/* 2. Core Development Principles: Persistent Global App Navbar */}
//           <nav 
//             className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/50 px-6 shadow-sm z-10"
//             aria-label="Workspace Administration Navigation"
//           >
//             <div className="flex items-center gap-4">
//               <span className="text-xs font-black tracking-widest uppercase text-slate-500 font-mono">
//                 Tawala Portal // Core
//               </span>
//             </div>
            
//             <div className="flex items-center gap-3">
//               {/* Desktop quick sale trigger element designed according to Fitts's Law (Accessible Touch/Click Target) */}
//               <button 
//                 type="button"
//                 className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/10 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all active:scale-[0.98] cursor-pointer"
//               >
//                 New Sale
//               </button>
//             </div>
//           </nav>

//           {/* Main workspace viewport content block. Isolated viewports handle inner scrolling exclusively */}
//           <main 
//             id="main-content" 
//             className="flex-1 overflow-y-auto px-6 py-8 focus:outline-none bg-slate-900 text-slate-200"
//             tabIndex={-1}
//           >
//             {children}
//           </main>
//         </div>
//       </div>
//     </>
//   );
// }

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/features/org/components/Sidebar';

export const metadata: Metadata = {
  title: 'Workspace | Tawala Business Management System',
  description: 'Manage sales, stock, staff, and customer ledgers across your businesses from your centralized Tawala dashboard.',
  alternates: {
    canonical: 'https://tawala.co.ke/org',
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface LayoutParams {
  organizationId: string;
}

interface OrganizationRootLayoutProps {
  children: React.ReactNode;
  params: Promise<LayoutParams>;
}

interface BusinessNode {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * 3. Performance Mandate: Server-side data fetch isolation
 * Added baseUrl parameter to construct the absolute address required by the server engine.
 */
async function fetchOrganizationBusinesses(organizationId: string): Promise<BusinessNode[]> {
  try {
    // 🔑 Combine parsed server origin with your proxy API route path
    const response = await fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/v1/org/stores`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch business infrastructure context for organization: ${organizationId}`);
    }

    const store =  await response.json();
    console.log("store: ", store)
  } catch (error) {
    console.error("Data Hydration Error:", error);
    return [
      { id: "biz_node_dev_01ac", name: "Tawala Node Alpha", isActive: true }
    ];
  }
}

export default async function OrganizationRootLayout({ 
  children, 
  params 
}: OrganizationRootLayoutProps) {
  
  // Resolve dynamic organization ID parameters
  const resolvedParams = await params;
  const organizationId = resolvedParams.organizationId;

  // 2. Pass calculated server origin forward into the fetch cycle
  const businesses = await fetchOrganizationBusinesses(organizationId);

  const primaryBusiness = businesses.find(b => b.isActive) || businesses[0];
  
  if (!primaryBusiness) {
    redirect(`/org/${organizationId}/setup-business`);
  }

  const activeBusinessId = primaryBusiness.id;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Tawala Business Management System',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'All',
    'browserRequirements': 'Requires JavaScript. Requires HTML5.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
        <Sidebar 
          organizationId={organizationId} 
          businessId={activeBusinessId} 
        />

        <div className="flex flex-1 flex-col overflow-hidden bg-slate-900">
          <nav 
            className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/50 px-6 shadow-sm z-10"
            aria-label="Workspace Administration Navigation"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-black tracking-widest uppercase text-slate-500 font-mono">
                Tawala Portal // Core
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/10 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all active:scale-[0.98] cursor-pointer"
              >
                New Sale
              </button>
            </div>
          </nav>

          <main 
            id="main-content" 
            className="flex-1 overflow-y-auto px-6 py-8 focus:outline-none bg-slate-900 text-slate-200"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}