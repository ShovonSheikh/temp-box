import React from 'react';
import tempInboxLogo from '../assets/tempinbox-logo.png';

// This component renders the TempInbox logo as an image, styled to match the UI theme
// You can further enhance this by using an SVG version for better color control

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({ className = '', style = {} }) => (
  <img
    src={tempInboxLogo}
    alt="TempInbox Logo"
    className={`h-10 w-auto select-none ${className}`}
    style={{
      filter: 'drop-shadow(0 2px 8px rgba(139,92,246,0.15))',
      ...style,
    }}
    draggable={false}
  />
);
