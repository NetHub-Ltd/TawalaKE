"use client";

import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ui-modal-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-glow",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ui-modal-title" className="text-h3">
          {title}
        </h2>
        <div className="mt-2 text-sm text-muted">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
