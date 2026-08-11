// app/org/OrgDecisionLoading.tsx
"use client";

import { useEffect, useState } from "react";

const messages = [
  "Setting up your workspace…",
  "Connecting your business data…",
  "Preparing your supply opportunities…",
  "Almost ready…",
];

const TIMEOUT_MS = 10_000;

export function OrgDecisionLoading() {
  const [index, setIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2200);

    const timeout = setTimeout(() => setTimedOut(true), TIMEOUT_MS);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timeout);
    };
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-7 w-7 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              This is taking longer than expected
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              We’re having trouble loading your organization right now.
              This can happen if the connection is slow or the session has expired.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
            >
              Try again
            </button>

            <a
              href="/login"
              className="block w-full text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-100" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Just a moment
          </h1>
          <p className="text-gray-600 h-6">{messages[index]}</p>
        </div>

        <p className="text-sm text-gray-400">
          Tawala is preparing your personalized experience
        </p>
      </div>
    </div>
  );
}