/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // necesario para export estático y Vercel sin servidor de imágenes
  },
}

module.exports = nextConfig
