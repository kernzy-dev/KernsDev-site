import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Manual vendor splits — each library group becomes its own browser-cached chunk.
        // A small Building tweak doesn't re-download three.js or framer-motion.
        // IMPORTANT: only groups that load INSIDE the lazy-loaded Scene; the main bundle
        // already excludes them via React.lazy on Scene.tsx, so these stay in the Scene chunk
        // but as separate cacheable files.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three") && !id.includes("@react-three")) return "three";
            if (id.includes("@react-three/drei")) return "drei";
            if (id.includes("@react-three/postprocessing") || id.includes("postprocessing")) return "postprocess";
            if (id.includes("@react-three/fiber")) return "r3f";
            if (id.includes("framer-motion") || id.includes("motion-utils") || id.includes("motion-dom")) return "framer";
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) return "react";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
