import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { getAllowedHosts } from './src/config/origin.config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = getAllowedHosts(env.VITE_ALLOWED_HOSTS);

  return {
    plugins: [react()],
    base: '/',
    server: {
      host: env.VITE_DEV_SERVER_HOST || 'localhost',
      port: parseInt(env.VITE_DEV_SERVER_PORT || '5173', 10),
      strictPort: false,
      cors: {
        origin: allowedHosts.length > 0 ? allowedHosts : true,
        credentials: true,
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            axios: ['axios'],
          },
        },
      },
    },
    define: {
      'process.env': {},
    },
  }
})
