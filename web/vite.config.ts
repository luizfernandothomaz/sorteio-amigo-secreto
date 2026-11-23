import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em dev, o Vite roda na 5173 e repassa /api para o .NET na 5000.
// No build, o resultado vai direto para api/wwwroot, servido pelo próprio .NET.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:5000" } },
  build: { outDir: "../api/wwwroot", emptyOutDir: true },
});
