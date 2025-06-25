import React, { useEffect, useRef } from 'react';

interface AdSenseAdProps {
  client: string;
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdSenseAd({ 
  client, 
  slot, 
  format = 'auto', 
  responsive = true, 
  style = {}, 
  className = '' 
}: AdSenseAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdPushed = useRef(false);

  useEffect(() => {
    // Only push the ad once per component instance and ensure content is present
    if (adRef.current && !isAdPushed.current) {
      try {
        // Initialize adsbygoogle array if it doesn't exist
        if (!window.adsbygoogle) {
          window.adsbygoogle = [];
        }
        
        // Only push ads on pages with substantial content
        const hasContent = document.body.innerText.length > 500;
        
        if (hasContent) {
          // Push the ad to the queue
          window.adsbygoogle.push({});
          isAdPushed.current = true;
          
          console.log(`AdSense ad pushed for slot: ${slot}`);
        } else {
          console.log(`AdSense ad skipped for slot ${slot} - insufficient content`);
        }
      } catch (error) {
        console.error('Error pushing AdSense ad:', error);
      }
    }
  }, [slot]);

  // Reset the push flag when slot changes (component reuse)
  useEffect(() => {
    isAdPushed.current = false;
  }, [slot]);

  const defaultStyle: React.CSSProperties = {
    display: 'block',
    minHeight: '90px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    ...style
  };

  return (
    <div className="ad-container" style={{ minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ins
        ref={adRef}
        className={`adsbygoogle ${className}`}
        style={defaultStyle}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}