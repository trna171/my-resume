import { transformSync } from '@babel/core';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import liveUiEditorBabelPlugin from './live-ui-editor.babel-plugin.js';

function liveUiEditorVitePlugin() {
  return {
    name: 'live-ui-editor-transform',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.jsx') && !id.endsWith('.js') && !id.endsWith('.tsx') && !id.endsWith('.ts')) {
        return null;
      }
      if (id.includes('/node_modules/')) {
        return null;
      }

      try {
        const result = transformSync(code, {
          filename: id,
          babelrc: false,
          configFile: false,
          presets: [['@babel/preset-react', { runtime: 'automatic' }]],
          plugins: [liveUiEditorBabelPlugin],
          sourceMaps: true,
        });

        return result?.code
          ? { code: result.code, map: result.map ?? null }
          : null;
      } catch (error) {
        console.error('Live UI Editor transform failed:', error);
        return null;
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), liveUiEditorVitePlugin()],
  server: {
    proxy: {
      // 开发环境把 /api 转发到 Express 后端（server/index.js）
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
