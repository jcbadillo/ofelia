import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Client-only app: build produces static files in out/ (Tech Spec §1.1).
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
