import React, { useEffect } from 'react';
import { pushAdSenseAd } from '../lib/ads';

interface AdContainerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export const AdContainer: React.FC<AdContainerProps> = ({
  slot,
  format = 'auto',
  className = '',
}) => {
  useEffect(() => {
    pushAdSenseAd();
  }, []);

  return (
    <div
      className={`my-4 w-full flex justify-center items-center overflow-hidden min-h-[90px] ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: '90px' }}
        data-ad-client="ca-pub-7059730627018047"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
