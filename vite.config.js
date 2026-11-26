import { defineConfig } from 'vite';
import { resolve } from 'path';

const emulatorOrigins = [9099, 8080, 5001, 9199]
  .map(port => `http://127.0.0.1:${port}`)
  .join(' ');

export default defineConfig({
  plugins: [{
    name: 'feastport-emulator-policy',
    apply: 'serve',
    transformIndexHtml(html) {
      if (process.env.VITE_FIREBASE_EMULATORS !== '1') return html;

      // The demo Firebase services use separate HTTP ports on the loopback interface.
      return html
        .replace(/connect-src ([^;"]+)/g, (_, sources) => `connect-src ${sources} ${emulatorOrigins}`)
        .replace(/; upgrade-insecure-requests/g, '');
    }
  }],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true
  },
  build: {
    target: 'es2022',
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
