import React, { useState } from 'react';
import { Bus } from 'lucide-react';
import { BRANDING } from '../../constants/branding';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light' | 'white';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'dark',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textClasses = {
    dark: {
      title: 'text-slate-900',
      subtitle: 'text-emerald-700',
      loc: 'text-slate-500',
    },
    light: {
      title: 'text-white',
      subtitle: 'text-emerald-400',
      loc: 'text-slate-300',
    },
    white: {
      title: 'text-white',
      subtitle: 'text-emerald-300',
      loc: 'text-emerald-100',
    },
  }[textColor];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative ${sizeClasses[size]} rounded-2xl overflow-hidden shrink-0 shadow-md bg-white border border-emerald-100 flex items-center justify-center p-0.5`}
      >
        {!hasError ? (
          <img
            src={BRANDING.logoUrl}
            alt={BRANDING.name}
            className="w-full h-full object-contain rounded-xl"
            onError={() => setHasError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-black rounded-xl">
            <Bus className="w-5 h-5" />
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-sm tracking-tight leading-tight uppercase font-heading ${textClasses.title}`}>
              DCPC <span className="text-emerald-600">Transport Coop</span>
            </span>
          </div>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${textClasses.subtitle}`}>
            {BRANDING.location}
          </span>
        </div>
      )}
    </div>
  );
};
