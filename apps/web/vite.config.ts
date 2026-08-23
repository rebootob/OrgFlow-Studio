import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@orgflow/domain': path.resolve(__dirname, '../../packages/domain/src')
    }
  },
  server: {
    port: 3010,
    host: '127.0.0.1'
  }
});