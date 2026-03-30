import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "MotorParts POS",
  description: "Motorcycle parts shop management web app",
};

/** Provides the root HTML shell for the application. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
