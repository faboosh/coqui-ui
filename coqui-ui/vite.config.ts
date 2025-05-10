import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.VITE_API_PORT": JSON.stringify(
      process.env.VITE_API_PORT || 5000
    ),
  },
});
