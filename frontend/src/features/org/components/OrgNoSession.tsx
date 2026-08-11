// app/org/OrgNoSession.tsx
import Link from "next/link";

export function OrgNoSession() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-7 w-7 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">
            Session expired or not found
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Please sign in again to continue to your workspace.
          </p>
        </div>

        <Link
          href="/login"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}