/** @type {import('next').NextConfig} */
const isTauri = process.env.TAURI_BUILD === 'true';

const nextConfig = {
  output: isTauri ? 'export' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
