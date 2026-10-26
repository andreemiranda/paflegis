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

const devOrigins = [
  '*.run.app',
  'localhost:3000',
  '127.0.0.1:3000',
  'ais-dev-jlnw7qnpwyszwi37kezans-124157476255.us-west1.run.app',
  'ais-pre-jlnw7qnpwyszwi37kezans-124157476255.us-west1.run.app',
];
if (process.env.APP_PUBLIC_URL) {
  try {
    devOrigins.push(new URL(process.env.APP_PUBLIC_URL).host);
  } catch {}
}
if (process.env.VERCEL_URL) {
  devOrigins.push(process.env.VERCEL_URL);
}

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: Array.from(new Set(devOrigins)),
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
