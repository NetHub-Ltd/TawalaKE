import { Sidebar } from '@/features/org/components/Sidebar';

export default function OrganizationRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full min-h-screen bg-white">
      {/* Dynamic context sidebar stays anchored persistently on the left side */}
      <Sidebar />
      
      {/* The main workspace viewport */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {children}
      </main>
    </div>
  );
}