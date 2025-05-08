import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    historyApiFallback: true,
    hmr: {
      overlay: false
    }
  },
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'es2020',
    logLevel: 'info',
    treeShaking: true,
    minify: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },
    supported: {
      'dynamic-import': true,
      'import-meta': true
    },
    keepNames: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: false
      }
    },
    target: 'es2020',
    minify: false,
    sourcemap: true
  }
})