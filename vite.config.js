import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
// allow cross origin opener policy for all
  server: {
    port: 3000,
    headers: {
      'Permissions-Policy': 'ch-ua-form-factor "self"',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },

})
