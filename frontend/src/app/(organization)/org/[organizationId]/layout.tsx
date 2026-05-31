import { Metadata } from 'next';
import { ReactNode } from 'react';
import React from 'react';

import { Header } from '@/features/org/components/Header';
import { Sidebar } from '@/features/org/components/Sidebar';

type Props = {
  children: ReactNode;
  params: Promise<{ organizationId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { organizationId } = await params;

  return {
    title: `Tawala Portal | Org Workspace ${organizationId}`,
    description: 'Enterprise Business Management Console and Multi-Tenant Administration Hub.',
    alternates: {
      canonical: `/org/${organizationId}`,
    },
  };
}

export default async function OrganizationLayout({ 
  children, 
  params 
}: Props) {
  const { organizationId } = await params;

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Tawala Platform Console",
    "applicationCategory": "BusinessApplication",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "permissions": "Owner, Manager authorized roles"
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface text-foreground flex flex-col font-sans antialiased selection:bg-brand-primary/20">
      
      {/* JSON-LD Technical SEO Script Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* Extracted Header Component Module */}
      <Header organizationId={organizationId} />

      {/* Core Operational Split Pane View (Sidebar + Main Window Viewport) */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Extracted Sidebar Navigation Component Module */}
        <Sidebar organizationId={organizationId} />

        {/* Main Window Viewport: Content scrolling is perfectly isolated here */}
        <main 
          id="workspace-viewport"
          className="flex-1 h-full overflow-x-hidden overflow-y-auto px-6 py-8 md:px-10 scroll-smooth bg-surface"
        >
          <div className="mx-auto w-full max-w-(screen-2xl) animate-fade-in">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}