import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
};

import AccessibilityBar from '@/components/AccessibilityBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import AdSenseBanner from '@/components/AdSenseBanner';
import Script from 'next/script';
import { getConfig } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();
  const siteName = config.siteName || 'Paflegis';
  const orgDesc = `${config.orgName} (${config.orgCity} - ${config.orgUf})`;
  const baseUrl = config.appPublicUrl || 'https://paflegis.vercel.app';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${siteName} · Consulta Pública e Transparência Legislativa de ${config.orgCity} - ${config.orgUf}`,
      template: `%s · ${siteName}`,
    },
    description: `Portal cívico e independente para consulta de matérias legislativas, normas jurídicas, atas e sessões plenárias da ${orgDesc}.`,
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
        { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.json',
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: baseUrl,
      title: `${siteName} · Consulta Pública Legislativa de ${config.orgCity} - ${config.orgUf}`,
      description: `Consulte projetos de lei, normas municipais, pautas e gravações de sessões plenárias de ${config.orgCity} - ${config.orgUf}.`,
      siteName: siteName,
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${siteName} · Transparência Legislativa Municipal`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} · Transparência Legislativa de ${config.orgCity} - ${config.orgUf}`,
      description: `Consulte projetos de lei, normas municipais e sessões da ${config.orgName}.`,
      images: [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getConfig();
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const baseUrl = config.appPublicUrl || 'https://paflegis.vercel.app';

  // Extrai o host de origem da API SAPL para DNS Prefetch dinâmico
  let saplOrigin = '';
  try {
    const u = new URL(config.saplApiBase);
    saplOrigin = `${u.protocol}//${u.host}`;
  } catch {
    saplOrigin = 'https://sapl.pedroafonso.to.leg.br';
  }

  // Schema.org Structured Data (Governança e Portal Cívico)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GovernmentOrganization',
        'name': config.orgName,
        'alternateName': config.orgAcronym,
        'url': baseUrl,
        'logo': `${baseUrl}/icon-512x512.png`,
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': config.orgCity,
          'addressRegion': config.orgUf,
          'addressCountry': 'BR',
        },
      },
      {
        '@type': 'WebSite',
        'name': config.siteName,
        'url': baseUrl,
        'description': config.siteDescription,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${baseUrl}/busca?termo={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* DNS-Prefetch e Preconnect dinâmicos para a URL base da API SAPL */}
        {saplOrigin && (
          <>
            <link rel="dns-prefetch" href={saplOrigin} />
            <link rel="preconnect" href={saplOrigin} crossOrigin="anonymous" />
          </>
        )}

        {/* Favicon e Ícones PNG nativos */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Schema.org JSON-LD para auditoria e SEO avançado */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {adsenseClientId && (
          <Script
            id="google-adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body>
        <AccessibilityBar />
        <Header />
        <div className="container">
          <AdSenseBanner slotType="header" />
        </div>
        <main className="flex-grow-1">{children}</main>
        <div className="container">
          <AdSenseBanner slotType="footer" />
        </div>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
