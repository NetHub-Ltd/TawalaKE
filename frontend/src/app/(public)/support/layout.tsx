import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | Tawala Help Center",
  description:
    "Get help with Tawala. Contact our Kenyan support team via WhatsApp, email, or phone. We're here to help your business succeed.",
  alternates: {
    canonical: "https://tawala.nethub.co.ke/support",
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
