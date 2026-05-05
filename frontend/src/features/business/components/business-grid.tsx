"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useBusiness} from "@/features/business/hooks/useBusiness";
import { useTenantStore } from "@/lib/store/useTenantStore";
import { BusinessCard } from "./business-card";
import { BusinessSkeleton } from "./loading-skeleton";
import { toast } from "sonner";

export function BusinessGrid() {
  const router = useRouter();
  const { setBusiness } = useTenantStore();
  const { businesses, isLoading } = useBusiness();

  if (isLoading) return <BusinessSkeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {businesses?.map((biz: any) => (
        <BusinessCard
          key={biz.id}
          biz={biz}
          onSelect={(b) => {
            setBusiness(b);
            toast.success(`Switching to ${b.name}`);
            router.push(`/home/${b.id}`);
          }}
          onEdit={(id) => toast.info(`Editing terminal ${id}`)}
          onDelete={(id) => {
            if (confirm("Decommission this terminal node?")) {
              // deleteBusiness(id);
              toast.error("Terminal deleted");
            }
          }}
        />
      ))}

      <button
        onClick={() => router.push("/home/create")}
        className="border-2 border-dashed border-gray-200 p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-black transition-all group min-h-[260px]"
      >
        <div className="p-6 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-all">
          <Plus size={32} />
        </div>
        <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-black">
          Provision New Node
        </span>
      </button>
    </div>
  );
}
