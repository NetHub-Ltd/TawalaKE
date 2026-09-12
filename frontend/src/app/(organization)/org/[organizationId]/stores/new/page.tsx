import { Metadata } from "next";
import StoreForm from "@/features/store/components/store-form";

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

export const metadata: Metadata = {
  title: "New branch | Tawala",
  description: "Create a new branch / store location.",
};

export default async function NewStorePage({ params }: PageProps) {
  const { organizationId } = await params;
  if (!organizationId) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Organization is required</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl justify-center p-2 sm:p-4">
      <StoreForm organizationId={organizationId} />
    </div>
  );
}
