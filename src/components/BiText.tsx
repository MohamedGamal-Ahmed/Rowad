import React from 'react';
import { BilingualString } from '../domain/common/BilingualString';

interface BiTextProps {
  text: BilingualString;
  primaryLang?: 'ar' | 'en';
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  stacked?: boolean;
}

export function BiText({ 
  text, 
  primaryLang = 'ar', 
  className = '',
  primaryClassName = '',
  secondaryClassName = '',
  stacked = true
}: BiTextProps) {
  const isArPrimary = primaryLang === 'ar';
  const Primary = isArPrimary ? text.ar : text.en;
  const Secondary = isArPrimary ? text.en : text.ar;

  if (stacked) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`font-semibold ${isArPrimary ? 'font-arabic' : 'font-sans'} ${primaryClassName}`}>
          {Primary}
        </span>
        <span className={`text-sm text-gray-500 ${!isArPrimary ? 'font-arabic' : 'font-sans'} ${secondaryClassName}`}>
          {Secondary}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-semibold ${isArPrimary ? 'font-arabic' : 'font-sans'} ${primaryClassName}`}>
        {Primary}
      </span>
      {Secondary && (
        <span className={`text-sm text-gray-400 ${!isArPrimary ? 'font-arabic' : 'font-sans'} ${secondaryClassName}`}>
          / {Secondary}
        </span>
      )}
    </div>
  );
}
