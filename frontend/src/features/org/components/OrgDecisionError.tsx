// // app/org/OrgDecisionError.tsx
// import { signOut } from "@/auth";

// export function OrgDecisionError() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
//       <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
//         <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
//           <svg
//             className="h-7 w-7 text-amber-600"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//             strokeWidth={2}
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//             />
//           </svg>
//         </div>

//         <div className="space-y-2">
//           <h1 className="text-xl font-semibold text-gray-900">
//             We couldn’t find your organization
//           </h1>
//           <p className="text-sm text-gray-600 leading-relaxed">
//             Your account is signed in, but we don’t have a business or
//             organization linked to it yet. This usually happens if the
//             onboarding process was interrupted.
//           </p>
//         </div>

//         <div className="space-y-3 pt-2">
//           <a
//             href="/onboarding/personal-details"
//             className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
//           >
//             Continue onboarding
//           </a>

//           <form
//             action={async () => {
//               "use server";
//               await signOut({ redirectTo: "/login" });
//             }}
//           >
//             <button
//               type="submit"
//               className="w-full text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
//             >
//               Sign out and start over
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
// features/org/components/OrgDecisionError.tsx
import { signOut } from "@/auth";
import Link from "next/link";

type OrgDecisionErrorProps = {
  title?: string;
  message?: string;
  showOnboarding?: boolean;
};

export function OrgDecisionError({
  title = "We couldn’t find your organization",
  message = "Your account is signed in, but we don’t have a business or organization linked to it yet. This usually happens if onboarding was interrupted.",
  showOnboarding = true,
}: OrgDecisionErrorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border/40 rounded-2xl shadow-lift p-8 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <svg
            className="h-7 w-7 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted leading-relaxed">{message}</p>
        </div>

        <div className="space-y-3 pt-2">
          {showOnboarding && (
            <Link
              href="/onboarding/personal-details"
              className="block w-full bg-brand-primary hover:opacity-90 text-white font-medium py-2.5 px-4 rounded-xl transition text-center"
            >
              Continue onboarding
            </Link>
          )}

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full text-sm text-muted hover:text-foreground underline underline-offset-2 py-2"
            >
              Sign out and start over
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}