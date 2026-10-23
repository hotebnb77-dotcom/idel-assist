import type { NextConfig } from "next";

// Export statique : l'application devient un simple site (HTML/JS/CSS)
// hébergeable n'importe où (Vercel, Netlify, GitHub Pages...).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
