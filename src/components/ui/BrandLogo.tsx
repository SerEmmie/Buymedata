import React, { useState } from 'react';
import { Link } from '../../router';
import logoImg from '../../assets/logo.png';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  linkToHome?: boolean;
}

export function BrandLogo({
  className = '',
  size = 'md',
  showSlogan = false,
  linkToHome = true,
}: BrandLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const heightClasses = {
    sm: 'h-6',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-14',
  };

  const fontSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const content = (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        {!imgFailed ? (
          <img
            src={logoImg}
            alt="BuyMeData"
            onError={() => setImgFailed(true)}
            className={`${heightClasses[size]} w-auto object-contain transition-transform hover:scale-[1.02]`}
          />
        ) : (
          /* Graceful stylized fallback if image asset cannot load */
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F22550] text-white flex items-center justify-center font-black text-base shadow-sm shadow-[#F22550]/30">
              B
            </div>
            <span className={`font-black ${fontSizes[size]} text-[#17191F] tracking-tight`}>
              BuyMe<span className="text-[#F22550]">Data</span>
            </span>
          </div>
        )}
      </div>
      {showSlogan && (
        <span className="text-[11px] font-medium text-gray-500 tracking-tight mt-0.5 pl-1">
          A little support goes a long way.
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
