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
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: baseUrl,
      title: `${siteName} · Consulta Pública Legislativa de ${config.orgCity} - ${config.orgUf}`,
      description: `Consulte projetos de lei, normas municipais, pautas e gravações de sessões plenárias de ${config.orgCity} - ${config.orgUf}.`,
      siteName: siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} · Transparência Legislativa de ${config.orgCity} - ${config.orgUf}`,
      description: `Consulte projetos de lei, normas municipais e sessões da ${config.orgName}.`,
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
  return (
    <html lang="pt-BR">
      <body>
        <AccessibilityBar />
        <Header />
        <main className="flex-grow-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
