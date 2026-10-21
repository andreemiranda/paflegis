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
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: uniqueHostnames.map((host) => ({
      protocol: 'https',
      hostname: host,
      port: '',
      pathname: '/**',
    })),
  },
  async headers() {
    const hostCsp = uniqueHostnames.map((h) => `https://${h}`).join(' ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${hostCsp} https://*.youtube.com https://*.ytimg.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' ${hostCsp} https://*.google-analytics.com https://*.analytics.google.com; frame-src 'self' ${hostCsp} https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com; media-src 'self' blob: data: https:; object-src 'none'; base-uri 'self';`
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, x-api-key, X-API-KEY' },
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
