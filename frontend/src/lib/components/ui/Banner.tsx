import { cn } from "@/lib/utils";

export function SuccessBanner({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("banner-success space-y-1 p-4", className)}>
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}
