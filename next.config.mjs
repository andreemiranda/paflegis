/** @type {import('next').NextConfig} */

const saplHostname = (() => {
  try {
    const raw = process.env.SAPL_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN || 'https://sapl.pedroafonso.to.leg.br';
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return u.hostname;
  } catch {
    return 'sapl.pedroafonso.to.leg.br';
  }
})();

const uniqueHostnames = Array.from(new Set(['sapl.pedroafonso.to.leg.br', saplHostname]));

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: uniqueHostnames.map((host) => ({
      protocol: 'https',
      hostname: host,
      port: '',
      pathname: '/**',
    })),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS, HEAD' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-api-key, X-API-KEY, x-api-keys, X-API-KEYS, x-cron-secret' },
        ],
      },
      {
        source: '/assets/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' }
        ]
      }
    ];
  },
};

export default nextConfig;
