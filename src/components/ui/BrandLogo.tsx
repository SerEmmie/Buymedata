import React from 'react';
import { Link } from '../../router';

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
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-14',
  };

  const content = (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <img
          src="/assets/aistudio/BuyMeData_Modern_Red_Logo_bc72d3ee.png"
          alt="BuyMeData"
          className={`${heightClasses[size]} w-auto object-contain transition-transform hover:scale-[1.02]`}
        />
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
