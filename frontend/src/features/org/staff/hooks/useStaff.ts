/**
 * @deprecated Use `@/features/staff/hooks/useStaff` — single staff module client.
 * This file remains only to avoid broken imports; it re-exports the canonical hook.
 */
export {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useSetStaffBusinesses,
  useResetStaffPassword,
  useStaffMember,
  type StaffMember,
  type CreateStaffInput,
  type StaffBusiness,
} from "@/features/staff/hooks/useStaff";
