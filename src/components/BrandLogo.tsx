import { useState } from 'react';
import { BRAND } from '../constants/brand';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const [imgSrc, setImgSrc] = useState<string>(BRAND.logoUrl);

  // Sizing definitions:
  // sm: 32px-36px (navbar / card badges)
  // md: 44px-52px (admin headers / compact blocks)
  // lg: 72px-84px (within 60-90px constraint for mobile & desktop hero)
  const sizeClasses = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-20 h-20 sm:w-22 sm:h-22',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full p-0.5 bg-gradient-to-tr from-[#25F4EE] via-[#00F2FE] to-[#FE2C55] shadow-lg shadow-[#00F2FE]/20 ${sizeClasses} ${className}`}
    >
      <img
        src={imgSrc}
        alt="Bilgi XwrtXwrt Logo"
        onError={() => setImgSrc(BRAND.fallbackLogoUrl)}
        className="w-full h-full object-cover rounded-full bg-black"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
