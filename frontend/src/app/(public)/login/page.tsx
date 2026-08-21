// import React from 'react';
// import type { Metadata } from 'next';
// import Link from 'next/link';
// import { LoginForm } from "@/features/auth/components/LoginForm";

// export const metadata: Metadata = {
//   title: 'Sign In | Tawala Console',
//   description: 'Sign in to access your Tawala business dashboard, manage sales, and track inventory in real time.',
//   alternates: {
//     canonical: 'https://tawala.nethub.co.ke/login',
//   },
// };

// export default function LoginPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     "name": "Tawala Console",
//     "url": "https://tawala.nethub.co.ke/login",
//     "applicationCategory": "BusinessApplication",
//     "operatingSystem": "All",
//     "browserRequirements": "Requires HTML5 support",
//     "description": "Business management console for tracking sales, stock, and business operations."
//   };

//   return (
//     <>
//       {/* Structured Data Injection */}
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       <main 
//         id="main-content" 
//         className="h-dvh w-full overflow-hidden flex flex-col items-center justify-between relative"
//       >
//         {/* Minimal Header Branding */}

//         {/* Clean Centered Form Module using your Silk & Slate Card Layer */}
//         <section 
//           aria-label="Account Authorization"
//           className="w-full max-w-md p-6"
//         >
//           <div className="card-layered sm:p-8 backdrop-blur-md">
//             <LoginForm />
//           </div>
//         </section>

//         {/* Minimal System Footer */}
//         <footer className="w-full max-w-md text-center text-xs text-muted pb-2">
//           <p>© {new Date().getFullYear()} Tawala. Encrypted & Secure.</p>
//         </footer>
//       </main>
//     </>
//   );
// }
import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | Tawala Console",
  description:
    "Sign in to access your Tawala business dashboard, manage sales, and track inventory in real time.",
  alternates: {
    canonical: "https://tawala.nethub.co.ke/login",
  },
};

function LoginFormFallback() {
  return (
    <div
      className="w-full space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading sign in form"
    >
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-lg bg-muted/30" />
        <div className="h-4 w-full max-w-xs rounded bg-muted/20" />
      </div>
      <div className="space-y-4">
        <div className="h-12 w-full rounded-xl bg-muted/20" />
        <div className="h-12 w-full rounded-xl bg-muted/20" />
        <div className="h-12 w-full rounded-xl bg-muted/25" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tawala Console",
    url: "https://tawala.nethub.co.ke/login",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    browserRequirements: "Requires HTML5 support",
    description:
      "Business management console for tracking sales, stock, and business operations.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        id="main-content"
        className="h-dvh w-full overflow-hidden flex flex-col items-center justify-between relative"
      >
        <section aria-label="Account Authorization" className="w-full max-w-md p-6">
          <div className="card-layered sm:p-8 backdrop-blur-md">
            <Suspense fallback={<LoginFormFallback />}>
              <LoginForm />
            </Suspense>
          </div>
        </section>

        <footer className="w-full max-w-md text-center text-xs text-muted pb-2">
          <p>© {new Date().getFullYear()} Tawala. Encrypted & Secure.</p>
        </footer>
      </main>
    </>
  );
}