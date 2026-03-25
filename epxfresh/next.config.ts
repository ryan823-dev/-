import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Specify the project root to avoid conflicts with parent directory
  turbopack: {
    root: __dirname,
  },
  
  // Static export for deployment to any CDN/hosting
  output: 'export',
  distDir: 'out',
  
  // Image optimization (disabled for static export)
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
