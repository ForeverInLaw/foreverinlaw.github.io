import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['dev.scam.software'],
    port: 5173,
    open: true,
    host: true,
    proxy: {
      '/api/now-playing': {
        target: 'https://spotify-now-playing.foreverinlaw.workers.dev',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/now-playing/, '/'),
      },
      '/api/playlists': {
        target: 'https://spotify-show-last-68db402e666c.herokuapp.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
