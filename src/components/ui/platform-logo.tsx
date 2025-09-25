'use client';

import { Apple, Smartphone, Globe, Monitor, Laptop } from 'lucide-react';

type PlatformType = 'IOS' | 'ANDROID' | 'WEB' | 'MAC' | 'PC';

interface PlatformLogoProps {
  platform: PlatformType;
  className?: string;
  size?: number;
}

const PlatformLogo = ({ platform, className = '', size = 16 }: PlatformLogoProps) => {
  const getIcon = () => {
    switch (platform.toUpperCase() as PlatformType) {
      case 'IOS':
        return <Apple size={size} className={className} />;
      case 'ANDROID':
        return <Smartphone size={size} className={className} />;
      case 'WEB':
        return <Globe size={size} className={className} />;
      case 'MAC':
        return <Laptop size={size} className={className} />;
      case 'PC':
        return <Monitor size={size} className={className} />;
      default:
        return <Globe size={size} className={className} />;
    }
  };

  return getIcon();
};

export default PlatformLogo;
