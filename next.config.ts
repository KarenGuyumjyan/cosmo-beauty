import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * Allow next/image to load from whichever S3 host is configured. Derived from
 * the env so switching storage providers needs no code change.
 */
function s3RemotePattern() {
  const raw = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
  if (!raw) return [];
  try {
    const { protocol, hostname } = new URL(raw);
    return [{ protocol: protocol.replace(':', '') as 'http' | 'https', hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Trace only the files actually used into a self-contained build. No-op on
  // Vercel; cuts the deploy from ~800MB of node_modules to ~100MB for a Node/
  // Docker host (relevant to the RF-hosting move).
  output: 'standalone',
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  serverExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'],
  // NOTE: do not add `experimental.optimizePackageImports: ['lucide-react']`.
  // Next already optimizes lucide-react by default, and listing it again makes
  // the build re-scan its ~3900 icon modules — which can stall the build on a
  // low-memory VPS.
  images: {
    // Serve AVIF first, then WebP — typically 20-30% smaller than the JPEG/PNG
    // originals. Biggest user-facing win on slow/blocked Russian networks.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      ...s3RemotePattern(),
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default withNextIntl(nextConfig);