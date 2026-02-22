import React from 'react';

interface PreviewOverlayProps {
  children: React.ReactNode;
  className?: string;
}

export default function PreviewOverlay({ children, className = '' }: PreviewOverlayProps) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-[var(--surface)] ${className}`}>
      {children}
    </div>
  );
}
