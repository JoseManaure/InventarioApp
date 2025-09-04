import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      "/api": {
        target: "https://inventarioapp-production-3736.up.railway.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
