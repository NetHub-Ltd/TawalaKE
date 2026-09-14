import { cn } from "@/lib/utils";

export function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("card-layered overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border bg-register">{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border last:border-0">{children}</tr>;
}

export function TD({
  children,
  className,
  align = "left",
  tabular,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
  tabular?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        align === "right" && "text-right",
        tabular && "amount",
        className
      )}
    >
      {children}
    </td>
  );
}

export function TableEmpty({ message }: { message: string }) {
  return (
    <div className="border-t border-border bg-register px-4 py-6 text-center text-sm text-muted">
      {message}
    </div>
  );
}
