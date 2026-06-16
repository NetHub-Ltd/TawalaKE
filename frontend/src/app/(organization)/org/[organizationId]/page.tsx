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