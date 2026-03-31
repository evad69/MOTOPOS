import type { Metadata } from "next";
import Script from "next/script";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "MotorParts POS",
  description: "Motorcycle parts shop management web app",
  manifest: "/manifest.json",
};

const localhostServiceWorkerResetScript = `
  (() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const isPwaEnabled = ${JSON.stringify(process.env.NEXT_PUBLIC_ENABLE_PWA === "true")};

    if (isPwaEnabled && !isLocalhost) {
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      })
      .catch(() => undefined);

    if ("caches" in window) {
      void caches.keys()
        .then((cacheKeys) => {
          cacheKeys.forEach((cacheKey) => {
            void caches.delete(cacheKey);
          });
        })
        .catch(() => undefined);
    }
  })();
`;

/** Provides the root HTML shell for the application. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-primary text-text-primary">
        <Script
          id="localhost-sw-reset"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: localhostServiceWorkerResetScript }}
        />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
