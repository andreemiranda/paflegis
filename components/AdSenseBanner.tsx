'use client';

import React, { useEffect } from 'react';

type AdSlotType =
  | 'header'
  | 'footer'
  | 'sidebar'
  | 'in_feed'
  | 'article_top'
  | 'article_bottom';

interface AdSenseBannerProps {
  slotType: AdSlotType;
  customSlotId?: string;
  className?: string;
}

const SLOT_ENV_MAP: Record<AdSlotType, string | undefined> = {
  header: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP_HEADER,
  footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  in_feed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED,
  article_top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_TOP,
  article_bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM,
};

export default function AdSenseBanner({
  slotType,
  customSlotId,
  className = '',
}: AdSenseBannerProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = customSlotId || SLOT_ENV_MAP[slotType];

  // Se não houver ID do cliente ou do slot configurado, NÃO exibe nenhum placeholder visual
  if (!clientId || !slotId) {
    return null;
  }

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      // Ignora erros de inicialização se AdBlock estiver ativo ou ambiente em validação
    }
  }, []);

  return (
    <div className={`adsense-wrapper overflow-hidden my-3 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
