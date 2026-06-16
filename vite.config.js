/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Auth + task ports from `.env` — `define` wins over stale shell / old dev-server cache. */
function clientEnv(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    VITE_API_BASE_URL: (
      env.VITE_API_BASE_URL || 'http://127.0.0.1:5001'
    ).replace(/\/$/, ''),
    VITE_TASK_API_BASE_URL: (
      env.VITE_TASK_API_BASE_URL || 'http://127.0.0.1:4000'
    ).replace(/\/$/, ''),
    VITE_CLOUDINARY_CLOUD_NAME: String(
      env.VITE_CLOUDINARY_CLOUD_NAME || '',
    ).replace(/\/$/, ''),
  }
}

/** file:// + `crossorigin` on scripts often prevents the UI from loading in Electron. */
function stripCrossoriginForElectron() {
  return {
    name: 'strip-crossorigin-electron',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(?:=["'][^"']*["'])?/gi, '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = clientEnv(mode)
  return {
  // Relative asset paths so `loadFile(dist/index.html)` works in Electron.
  base: command === 'build' ? './' : '/',
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    'import.meta.env.VITE_TASK_API_BASE_URL': JSON.stringify(
      env.VITE_TASK_API_BASE_URL,
    ),
    'import.meta.env.VITE_CLOUDINARY_CLOUD_NAME': JSON.stringify(
      env.VITE_CLOUDINARY_CLOUD_NAME,
    ),
  },
  plugins: [
    react(
      // Electron dev runs with a strict CSP (no unsafe-eval), so disable React Fast Refresh.
      process.env.ELECTRON === 'true' ? { fastRefresh: false } : undefined,
    ),
    tailwindcss(),
    stripCrossoriginForElectron(),
  ],
  // Electron: wait for crawl before serving (prep script pre-bundles deps).
  optimizeDeps: {
    holdUntilCrawlEnd: process.env.ELECTRON === 'true',
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-dev-runtime',
      'react-redux',
      'react-router-dom',
      '@reduxjs/toolkit',
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: env.VITE_API_BASE_URL,
        changeOrigin: true,
      },
      /** Task backend — same-origin so Electron/Vite avoids CORS. */
      '/task-api': {
        target: env.VITE_TASK_API_BASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/task-api/, ''),
      },
    },
  },
}})
