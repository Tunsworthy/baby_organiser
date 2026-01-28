import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const sslKeyPath = process.env.SSL_KEY_PATH
const sslCertPath = process.env.SSL_CERT_PATH

let httpsConfig = false
if (sslKeyPath && sslCertPath) {
  try {
    httpsConfig = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    }
  } catch (err) {
    console.warn('SSL cert files not found, falling back to HTTP')
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsConfig,
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
    cors: true
  }
})
