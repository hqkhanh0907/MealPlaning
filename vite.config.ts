import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {type PluginOption, defineConfig} from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({mode}) => {
  const isProduction = mode === 'production';
  const enableCompression = process.env.COMPRESS === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      enableCompression &&
        viteCompression({algorithm: 'gzip', ext: '.gz', threshold: 1024, deleteOriginFile: false}),
      enableCompression &&
        viteCompression({algorithm: 'brotliCompress', ext: '.br', threshold: 1024}),
      process.env.ANALYZE === 'true' &&
        import('rollup-plugin-visualizer').then(m =>
          m.visualizer({filename: 'stats.html', gzipSize: true, brotliSize: true, template: 'treemap'}),
        ),
    ].filter(Boolean) as PluginOption[],
    resolve: {
      alias: {
        '@/': `${path.resolve(__dirname, './src')}/`,
      },
    },
    worker: {
      format: 'es',
    },
    build: {
      target: 'esnext',
      assetsInlineLimit: 0,
      sourcemap: isProduction ? 'hidden' : true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['lucide-react', 'motion'],
            'vendor-i18n': ['i18next', 'react-i18next'],
          },
        },
      },
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    css: {
      devSourcemap: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'i18next',
        'react-i18next',
        'zustand',
        'lucide-react',
        'motion',
      ],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx'],
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  };
});
