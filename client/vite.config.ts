import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // This tells Vite that "@" is a shortcut for the "src" directory
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
