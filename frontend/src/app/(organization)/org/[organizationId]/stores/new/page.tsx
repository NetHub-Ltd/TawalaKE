import { Metadata } from "next";
// import StoreForm from "./store-form";
import StoreForm from "@/features/store/components/store-form"

interface NewStorePageParams {
  organizationId: string
}

interface PageProps {
  params: Promise<NewStorePageParams>;
}

export const metadata: Metadata = {
  title: "Provision New Store Outlet | NetHub PaaS",
  description:
    "Provision and configure new store outlets, regional branch locations, and POS industry rules on the NetHub PaaS platform.",
  alternates: {
    canonical: "https://nethub.co.ke/org/stores/new",
  },
};

export default async function NewStorePage({ params }: PageProps) {
  const { organizationId} = await params;

  if (!organizationId){
    return (
      <div>
        <h1>Organization is required!</h1>
      </div>
    )
  }

  return (
    <main id="main-content" className="min-h-screen w-full flex items-center justify-center p-4 md:p-8">
      
      <StoreForm organizationId={organizationId} />
    </main>
  );
}