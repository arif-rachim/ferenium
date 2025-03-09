import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [react()],
    build: {
        outDir: "dist",
        target: 'esnext', // Avoid unnecessary polyfills
        minify: 'esbuild', // Use fast minifier
        sourcemap: true, // Enable source maps
        rollupOptions: {
            external: ['sql-wasm.js'], // Exclude this script from bundling,
        },
        commonjsOptions: {
            sourceMap: false, // Disable source maps for CommonJS dependencies
        }
    }
})
