import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IDEL Assist – démo",
  description: "Prototype de démonstration pour infirmière libérale remplaçante. Données fictives uniquement.",
  manifest: "manifest.webmanifest",
  // Démonstration privée : on demande aux moteurs de recherche de ne pas indexer.
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: { capable: true, title: "IDEL Assist", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f7fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
