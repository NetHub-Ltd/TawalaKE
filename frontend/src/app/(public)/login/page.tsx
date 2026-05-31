import React from 'react';
import { Metadata } from 'next';
// import { LoginForm } from './components/LoginForm';
import {LoginForm} from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: 'Tawala | Identity Access Engine',
  description: 'Enterprise access checkpoint for authorized personnel configuration sessions.',
};

export default async function LoginPage() {
  return (
    <div className="min-h-screen bg-surface px-4 flex flex-col items-center justify-center transition-colors duration-300 dark:bg-surface">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Simplified Premium Brand Title Signature Section */}
        <header className="mb-6 text-center">
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Enterprise Management Platform Suite
          </p>
        </header>

        {/* Dynamic Card Layer Enclosure housing Client Input Elements */}
        <div className="card-layered bg-background p-6 md:p-8">
          <LoginForm />
        </div>

        {/* Reassuring Production System Footprint Subtext */}
        <footer className="text-center text-[10px] font-mono text-muted tracking-wider uppercase mt-8">
          Built for Business • Simple, Secure & Reliable
        </footer>
        
      </div>
    </div>
  );
}