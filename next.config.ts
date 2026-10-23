import type { NextConfig } from "next";

// Export statique : l'application devient un simple site (HTML/JS/CSS)
// hébergeable n'importe où (Vercel, Netlify, GitHub Pages...).
// NEXT_BASE_PATH permet d'héberger l'app dans un sous-dossier (ex. GitHub Pages : "/idel-assist").
const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
