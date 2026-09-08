// =====================================================================
// VITE CONFIG
// ---------------------------------------------------------------------
// Vite is the tool that runs and builds the React frontend.
//
// The interesting part here is the "proxy": the frontend runs on
// port 5173, but the backend runs on port 5000. Instead of typing
// the full backend address everywhere, we tell Vite: any request that
// starts with /api should be silently forwarded to port 5000.
//
// That is why the frontend can call short paths like "/api/products".
// =====================================================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The React plugin lets Vite understand .jsx files.
  plugins: [react()],
  server: {
    // The frontend will open on this port (http://localhost:5173).
    port: 5173,
    proxy: {
      // Forward any /api/... request to the backend on port 8000.
      // (Keep this in sync with the PORT value in backend/.env.)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});