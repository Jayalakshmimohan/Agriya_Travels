import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          about: path.resolve(__dirname, 'about/index.html'),
          indiaTours: path.resolve(__dirname, 'india-tours/index.html'),
          internationalTours: path.resolve(__dirname, 'international-tours/index.html'),
          themeTours: path.resolve(__dirname, 'theme-tours/index.html'),
          rentals: path.resolve(__dirname, 'rentals/index.html'),
          corporate: path.resolve(__dirname, 'corporate/index.html'),
          gallery: path.resolve(__dirname, 'gallery/index.html'),
          testimonials: path.resolve(__dirname, 'testimonials/index.html'),
          aiPlanner: path.resolve(__dirname, 'ai-planner/index.html'),
          contact: path.resolve(__dirname, 'contact/index.html'),
          notFound: path.resolve(__dirname, '404.html'),
        },
      },
    },
  };
});
