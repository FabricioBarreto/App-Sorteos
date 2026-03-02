import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Makallé - Sorteos Día de la Mujer",
  description: "Registrate y participá del sorteo por el Día de la Mujer en Makallé",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="gradient-bg min-h-screen">{children}</body>
    </html>
  );
}
