'use client';

import { useState } from 'react';
import { ErrorDetails, ErrorRecovery } from '@/lib/error-handling';

export interface ErrorDisplayProps {
  error: ErrorDetails | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  onApplyFix?: (fixedContent: string) => void;
  currentContent?: string;
  compact?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  onApplyFix,
  currentContent,
  compact = false,
  className = ''
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'syntax':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'rendering':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'export':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'storage':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getErrorTypeLabel = () => {
    switch (error.type) {
      case 'syntax':
        return 'Syntax Error';
      case 'rendering':
        return 'Rendering Error';
      case 'export':
        return 'Export Error';
      case 'storage':
        return 'Storage Error';
      case 'network':
        return 'Network Error';
      case 'validation':
        return 'Validation Error';
      default:
        return 'Error';
    }
  };

  const handleApplyAutoFix = () => {
    if (currentContent && onApplyFix) {
      const { fixed, changes } = ErrorRecovery.attemptSyntaxFix(currentContent);
      if (changes.length > 0) {
        onApplyFix(fixed);
      }
    }
  };

  const canAutoFix = error.type === 'syntax' && currentContent && onApplyFix;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm ${className}`}>
        {getErrorIcon()}
        <span className="text-red-800 dark:text-red-200 flex-1 truncate">
          {error.message}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-xs underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-border">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">
            {getErrorTypeLabel()}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        {/* Primary Actions */}
        <div className="flex gap-2 flex-wrap">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
          
          {canAutoFix && (
            <button
              onClick={handleApplyAutoFix}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Auto Fix
            </button>
          )}

          {error.suggestions && error.suggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="bg-muted text-muted-foreground hover:bg-muted/80 px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </button>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && error.suggestions && error.suggestions.length > 0 && (
          <div className="bg-muted rounded-lg p-3">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Suggestions:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Details (Development) */}
        {process.env.NODE_ENV === 'development' && error.originalError && (
          <div className="border-t border-border pt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-muted rounded text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                <div className="mb-2">
                  <strong>Error:</strong> {error.originalError.message}
                </div>
                {error.originalError.stack && (
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">
                      {error.originalError.stack}
                    </pre>
                  </div>
                )}
                {error.context && (
                  <div>
                    <strong>Context:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized error displays for different contexts
export function SyntaxErrorDisplay({ 
  error, 
  onRetry, 
  onApplyFix, 
  currentContent 
}: {
  error: ErrorDetails;
  onRetry?: () => void;
  onApplyFix?: (content: string) => void;
  currentContent?: string;
}) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onApplyFix={onApplyFix}
      currentContent={currentContent}
      className="border-red-200 dark:border-red-800"
    />
  );
}

export function ExportErrorDisplay({ 
  error, 
  onRetry 
}: {
  error: ErrorDetails;
  onRetry?: () => void;
}) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      compact={true}
      className="border-blue-200 dark:border-blue-800"
    />
  );
}

export function StorageErrorDisplay({ 
  error 
}: {
  error: ErrorDetails;
}) {
  return (
    <ErrorDisplay
      error={error}
      compact={true}
      className="border-yellow-200 dark:border-yellow-800"
    />
  );
}

export default ErrorDisplay;