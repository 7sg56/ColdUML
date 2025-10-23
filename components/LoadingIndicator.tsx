'use client';

import { useEffect, useState } from 'react';

export interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  message?: string;
  delay?: number; // Delay before showing loader (prevents flash for quick operations)
  className?: string;
}

export function LoadingIndicator({ 
  size = 'md', 
  variant = 'spinner', 
  message, 
  delay = 0,
  className = '' 
}: LoadingIndicatorProps) {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!show) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const renderSpinner = () => (
    <svg
      className={`animate-spin ${sizeClasses[size]} text-current`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-current rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-current rounded-full animate-pulse opacity-75`} />
  );

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-current rounded opacity-25"></div>
      <div className="h-4 bg-current rounded opacity-25 w-3/4"></div>
      <div className="h-4 bg-current rounded opacity-25 w-1/2"></div>
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
      {renderLoader()}
      {message && (
        <span className={textSizeClasses[size]}>
          {message}
        </span>
      )}
    </div>
  );
}

// Specialized loading components for common use cases
export function EditorLoadingIndicator() {
  return (
    <div className="h-full flex items-center justify-center bg-editor-background">
      <LoadingIndicator 
        size="lg" 
        message="Loading editor..." 
        delay={200}
      />
    </div>
  );
}

export function PreviewLoadingIndicator() {
  return (
    <div className="flex items-center justify-center p-4">
      <LoadingIndicator 
        size="md" 
        message="Rendering diagram..." 
        delay={100}
      />
    </div>
  );
}

export function ExportLoadingIndicator({ operation }: { operation: string }) {
  return (
    <LoadingIndicator 
      size="sm" 
      message={`${operation}...`} 
      delay={0}
    />
  );
}

// Full-screen loading overlay
export function LoadingOverlay({ 
  message = "Loading...", 
  show = true 
}: { 
  message?: string; 
  show?: boolean; 
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <LoadingIndicator 
          size="lg" 
          message={message} 
          className="text-foreground"
        />
      </div>
    </div>
  );
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState<string>();

  const startLoading = (message?: string) => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  };

  const withLoading = async <T,>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message);
    try {
      const result = await operation();
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
}

export default LoadingIndicator;