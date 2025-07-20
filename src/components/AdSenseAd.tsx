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

  useEffect(() => {
    const pushAd = () => {
      if (!adRef.current) return;
      
      // Check if ad is already processed
      if (adRef.current.getAttribute('data-adsbygoogle-status') === 'done') {
        return;
      }
      
      // Check if container has valid width
      if (adRef.current.offsetWidth === 0) {
        // Retry after a short delay to allow container to render
        setTimeout(pushAd, 100);
        return;
      }
      
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
          
          console.log(`AdSense ad pushed for slot: ${slot}`);
        } else {
          console.log(`AdSense ad skipped for slot ${slot} - insufficient content`);
        }
      } catch (error) {
        console.error('Error pushing AdSense ad:', error);
      }
    };
    
    // Start the ad push process
    pushAd();
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