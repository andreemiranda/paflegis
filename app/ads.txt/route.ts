import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  let content = '';

  // Lê o ads.txt padrão de /public se existir
  try {
    const filePath = path.join(process.cwd(), 'public', 'ads.txt');
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    // fallback
  }

  // Se houver ID de cliente AdSense configurado em variável de ambiente, garante presença da linha do AdSense
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (adsenseClientId) {
    const pubId = adsenseClientId.replace('ca-', '');
    const adsenseLine = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0`;
    if (!content.includes(pubId)) {
      content = `${adsenseLine}\n${content}`;
    }
  }

  if (!content.trim()) {
    content = '# Google AdSense ads.txt\n';
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
