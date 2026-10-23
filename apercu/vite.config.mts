import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Construit apercu/dist/app.js + app.css, assemblés ensuite en un seul HTML.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "../src") } },
  css: { postcss: path.resolve(__dirname, "..") },
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: path.resolve(__dirname, "main.tsx"), formats: ["iife"], name: "IdelAssist", fileName: () => "app.js" },
    rollupOptions: { output: { assetFileNames: "app.[ext]" } },
  },
});
