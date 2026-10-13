import type { Metadata } from "next";

/** Signed support threads are private — never index or snippet. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function PublicSupportThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
