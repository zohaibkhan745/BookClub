
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      // Ensure modulepreload works in all browsers (helps with large chunks like Supabase)
      modulePreload: {
        polyfill: true,
      },
      // Code splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - separate heavy libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['lucide-react'],
            'supabase': ['@supabase/supabase-js'],
            'swr-vendor': ['swr'],
          },
        },
      },
      // Minification settings
      minify: 'esbuild',
      // Generate source maps for production debugging
      sourcemap: false,
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      open: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    },
  });