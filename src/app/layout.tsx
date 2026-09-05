import type { Metadata, Viewport } from "next";
import { SelectionProvider } from "@/components/SelectionProvider";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bocal — HelloFresh → courses",
  description:
    "Choisis des recettes HelloFresh et génère une liste de courses triée par rayon, exportable dans Notes ou Rappels.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <SelectionProvider>
          <SiteHeader />
          <main className="app-main">{children}</main>
        </SelectionProvider>
      </body>
    </html>
  );
}
