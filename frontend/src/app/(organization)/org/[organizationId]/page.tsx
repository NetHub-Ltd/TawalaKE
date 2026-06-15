// // app/(organization)/org/[organizationId]/page.tsx
// import { redirect } from "next/navigation";
// import { headers } from "next/headers";

// interface DecisionPageProps {
//   params: Promise<{ organizationId: string }>;
// }

// export default async function OrganizationDecisionPage({ params }: DecisionPageProps) {
//   const resolvedParams = await params;
//   const organizationId = resolvedParams.organizationId;

//   // 1. Reconstruct absolute url for internal fetch proxy routing via server headers
//   const headersList = await headers();
//   const host = headersList.get("host") || "localhost:3000";
//   const cookieHeader = headersList.get("cookie") || "";
//   const protocol = host.startsWith("localhost") ? "http" : "https";

//   try {
//     // 2. Query your internal proxy to find out what stores are linked here
//     const response = await fetch(`${protocol}://${host}/api/v1/org/stores`, {
//       method: "GET",
//       headers: { Cookie: cookieHeader },
//     });

//     if (!response.ok) {
//       // If the API fails, drop them into a safe default branch node
//       redirect(`/org/${organizationId}/biz_default_terminal`);
//     }

//     const stores = await response.json();

//     // 3. DECISION ENGINE: Where should this user go?
    
//     // Case A: If they have no stores registered yet, send them to the setup wizard
//     if (!stores || stores.length === 0) {
//       redirect(`/org/${organizationId}/setup-business`);
//     }

//     // Case B: Find their primary/active store location context
//     const primaryStore = stores[0];
//     console.log("primary store", primaryStore)
    
//     // Case C: Future Role Escalation Interception (Example)
//     // const userRole = getUserRoleFromSession();
//     // if (userRole === "CASHIER") { 
//     //   redirect(`/org/${organizationId}/${primaryStore.id}/terminal`); 
//     // }

//     // Fallback: Bounce them cleanly into their active terminal node layout path
//     redirect(`/org/${organizationId}/${primaryStore.id}`);

//   } catch (error) {
//     console.error("Critical Decision Layer Error:", error);
//     // Hard fallback rescue loop to prevent infinite app loops
//     redirect(`/org/${organizationId}/biz_default_terminal`);
//   }
// }

// app/(organization)/org/[organizationId]/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";

interface DecisionPageProps {
  params: Promise<{ organizationId: string }>;
}

export default async function OrganizationDecisionPage({ params }: DecisionPageProps) {
  const resolvedParams = await params;
  const organizationId = resolvedParams.organizationId;

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const cookieHeader = headersList.get("cookie") || "";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  // Create a tracking variable to store our calculated route path string
  let targetRedirectPath: string | null = null;

  try {
    const response = await fetch(`${protocol}://${host}/api/v1/org/stores`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
    });

    if (!response.ok) {
      throw new Error(`API error response status code context: ${response.status}`);
    }

    const stores = await response.json();
    
    if (!stores || stores.length === 0) {
      targetRedirectPath = `/org/${organizationId}/setup-business`;
    } else {
      const primaryStore = stores[0];
      console.log("🎯 Primary store successfully extracted:", primaryStore);
      
      // 🔑 Pull the validated .id property from your data schema payload safely
      targetRedirectPath = `/org/${organizationId}/${primaryStore.id}`;
    }

  } catch (error) {
    console.error("Internal processing loop caught an error:", error);
    // If the data compilation completely falls apart, set the safety backup route here
    targetRedirectPath = `/org/${organizationId}/biz_default_terminal`;
  }

  // 🚀 Now execute the redirect SAFELY outside the try/catch context block!
  if (targetRedirectPath) {
    redirect(targetRedirectPath);
  }
}