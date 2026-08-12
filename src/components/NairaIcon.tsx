import React from 'react';

export const NairaIcon = ({ size = 20, className = "", ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    <path d="M6 19L18 5" />
    <path d="M6 5v14h12V5" />
    <path d="M4 10h16" />
    <path d="M4 14h16" />
  </svg>
);
