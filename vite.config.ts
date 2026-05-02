import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// import { compression } from "vite-plugin-compression2";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === "analyze" &&
      visualizer({
        open: true,
        filename: "stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
    // compression({
    //   include: [/\.(js)$/, /\.(css)$/, /\.(html)$/],
    //   threshold: 1400,
    //   algorithms: ["brotliCompress"],
    // }),
  ],

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,

    // Tauri 开发时需要显式 host
    host: host ?? "localhost",

    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,

    watch: {
      ignored: ["**/src-tauri/**", "**/*.md", "**/*.zmark"],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("yjs") || id.includes("@hocuspocus")) {
              return "vendor-collab";
            }
            if (id.includes("echarts") || id.includes("zrender")) {
              return "vendor-echarts";
            }
            if (id.includes("katex")) {
              return "vendor-katex";
            }
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("@tiptap") ||
              id.includes("tiptap") ||
              id.includes("prosemirror")
            ) {
              return "vendor-editor";
            }
            if (
              id.includes("lucide-react") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge") ||
              id.includes("radix-ui")
            ) {
              return "vendor-ui";
            }
            return "vendor";
          }
        },
      },
    },
  },
}));
