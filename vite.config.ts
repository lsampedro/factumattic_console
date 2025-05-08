import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: false // Disable fast refresh temporarily to reduce complexity
    })
  ],
  server: {
    historyApiFallback: true,
    force: true, // Force the server to ignore the cache
    hmr: {
      overlay: false // Disable the HMR overlay to reduce overhead
    }
  },
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'es2020',
    logLevel: 'info',
    treeShaking: false, // Disable tree shaking in development
    minify: false, // Disable minification in development
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },
    supported: {
      'dynamic-import': true,
      'import-meta': true
    },
    keepNames: true // Preserve function and class names
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: false
      }
    },
    target: 'es2020',
    minify: false, // Disable minification during build
    sourcemap: true
  }
})