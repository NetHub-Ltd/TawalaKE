export type PermissionCatalogItem = {
  code: string;
  group: string;
  label: string;
  description: string;
  resources: string[];
  default_roles: string[];
};

export type OrgOverrideItem = {
  permission_code: string;
  effect: string;
};

export async function fetchPermissionCatalog(): Promise<PermissionCatalogItem[]> {
  const res = await fetch("/api/v1/org/permissions/catalog", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load permission catalog");
  return res.json();
}

export async function fetchOrgOverrides(): Promise<OrgOverrideItem[]> {
  const res = await fetch("/api/v1/org/permissions/overrides", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load organization policy");
  return res.json();
}

export async function saveOrgDenies(denies: string[]): Promise<OrgOverrideItem[]> {
  const res = await fetch("/api/v1/org/permissions/overrides", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ denies }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : typeof body?.detail === "string"
          ? body.detail
          : "Could not save organization policy"
    );
  }
  return res.json();
}

export type StaffOverridesPayload = {
  staff_id: string;
  role: string | null;
  role_permissions: string[];
  org_denies: string[];
  overrides: { permission_code: string; effect: string }[];
};

export async function fetchStaffOverrides(
  staffId: string
): Promise<StaffOverridesPayload> {
  const res = await fetch(`/api/v1/org/staff/${staffId}/permission-overrides`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not load staff overrides");
  return res.json();
}

export async function saveStaffOverrides(
  staffId: string,
  overrides: { permission_code: string; effect: string }[]
): Promise<unknown> {
  const res = await fetch(`/api/v1/org/staff/${staffId}/permission-overrides`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : "Could not save staff overrides"
    );
  }
  return res.json();
}
