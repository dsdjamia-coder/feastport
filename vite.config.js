import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        judge: resolve(__dirname, 'judge.html'),
        publish: resolve(__dirname, 'publish.html'),
        results: resolve(__dirname, 'results.html'),
        team: resolve(__dirname, 'team.html'),
        tv: resolve(__dirname, 'tv.html'),
        tvControl: resolve(__dirname, 'tv-control.html')
      }
    }
  }
});
