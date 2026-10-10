import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Système de Gestion de Facturation - LE SECOURS SARLU",
  description: "Gestion complète des opérations de facturation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
