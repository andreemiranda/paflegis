import type { Metadata } from 'next';
import './globals.css';
import AccessibilityBar from '@/components/AccessibilityBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  metadataBase: new URL('https://paflegis.vercel.app'),
  title: {
    default: 'Paflegis · Consulta Pública e Transparência Legislativa de Pedro Afonso - TO',
    template: '%s · Paflegis',
  },
  description:
    'Portal cívico e independente para consulta de matérias legislativas, normas jurídicas, atas e sessões plenárias da Câmara Municipal de Pedro Afonso - TO.',
  creator: 'Paflegis',
  publisher: 'Paflegis',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://paflegis.vercel.app',
    title: 'Paflegis · Consulta Pública Legislativa de Pedro Afonso - TO',
    description:
      'Consulte projetos de lei, normas municipais, pautas e gravações de sessões plenárias de Pedro Afonso - TO.',
    siteName: 'Paflegis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paflegis · Transparência Legislativa de Pedro Afonso - TO',
    description: 'Consulte projetos de lei, normas municipais e sessões da Câmara de Pedro Afonso - TO.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
