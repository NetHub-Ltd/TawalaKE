import { Metadata } from 'next';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  params: Promise<{ organizationId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { organizationId } = await params;

  return {
    title: `Tawala | Organization ${organizationId}`,
    description: 'Business Management System',
    // You can fetch organization name later and make it dynamic
  };
}

export default async function OrganizationLayout({ 
  children, 
  params 
}: Props) {
  const { organizationId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* You can add a top navigation bar here later */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Tawala</p>
              <p className="text-xs text-gray-500 -mt-1">Organization • {organizationId}</p>
            </div>
          </div>

          {/* Placeholder for future user menu, business switcher, etc. */}
          <div className="text-sm text-gray-500">
            Org ID: <span className="font-mono text-gray-700">{organizationId}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}