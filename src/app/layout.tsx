import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "MotorParts POS",
  description: "Motorcycle parts shop management web app",
  manifest: "/manifest.json",
};

/** Provides the root HTML shell for the application. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-primary text-text-primary">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
