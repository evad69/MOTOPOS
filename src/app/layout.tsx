import type { Metadata } from "next";
import Script from "next/script";
import { AppProvider } from "@/context/AppContext";
import { Sidebar } from "@/components/Sidebar";
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
        <AppProvider>
          <div className="flex min-h-screen overflow-hidden bg-bg-primary text-text-primary">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </AppProvider>
      </body>
      <Script
        id="service-worker-registration"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function () {});
            }
          `,
        }}
      />
    </html>
  );
}
