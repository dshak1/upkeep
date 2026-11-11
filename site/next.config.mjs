import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // The repo root has its own lockfile (the CLI); this app's root is site/.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
}
export default nextConfig
