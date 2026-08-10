import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              id.includes('react-dom') ||
              /node_modules[\\/]react[\\/]/.test(id) ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/react-is/')
            ) return 'react-vendor';
            if (id.includes('@supabase') || id.includes('node_modules/ws/')) return 'supabase';
            if (id.includes('pdfjs-dist')) return 'pdf-reader';
            if (id.includes('node_modules/jspdf/')) return 'pdf-export';
            if (id.includes('node_modules/html2canvas/')) return 'html-capture';
            if (id.includes('node_modules/dompurify/')) return 'html-sanitizer';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('motion') || id.includes('framer-motion')) return 'motion';
            if (id.includes('react-pageflip') || id.includes('page-flip')) return 'page-flip';
            if (id.includes('canvas-confetti')) return 'confetti';
            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
