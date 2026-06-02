"use client";

import React from "react";
import { BusinessContext } from "@/features/business/hooks/useBusiness";

/**
 * @Scribe_Audit
 * Purpose: Bridges the gap between Server Layout and Client Context.
 * Logic: Wraps children in the BusinessContext.Provider to allow client hooks access.
 */

interface BusinessProviderProps {
  children: React.ReactNode;
  businessId: string;
  businessName: string;
  organizationId: string;
}

export function BusinessProvider({
  children,
  businessId,
  businessName,
  organizationId
}: BusinessProviderProps) {
  return (
    <BusinessContext.Provider value={{ businessId, businessName, organizationId }}>
      {children}
    </BusinessContext.Provider>
  );
}
