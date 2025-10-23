/**
 * Comprehensive error handling utilities for the Mermaid UML Editor
 */

export interface ErrorDetails {
  type: 'syntax' | 'rendering' | 'export' | 'storage' | 'network' | 'validation' | 'unknown';
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
  suggestions?: string[];
  recoverable: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Mermaid syntax error patterns and their user-friendly messages
 */
const MERMAID_ERROR_PATTERNS = [
  {
    pattern: /Parse error on line (\d+)/i,
    type: 'syntax' as const,
    getMessage: (match: RegExpMatchArray) => 
      `Syntax error on line ${match[1]}. Please check your Mermaid syntax.`,
    suggestions: [
      'Check for missing or extra brackets, parentheses, or quotes',
      'Ensure proper indentation and spacing',
      'Verify that all class names and relationships are properly formatted'
    ]
  },
  {
    pattern: /Expecting .* got .*/i,
    type: 'syntax' as const,
    getMessage: () => 'Unexpected syntax found. Please check your diagram structure.',
    suggestions: [
      'Review the Mermaid class diagram syntax documentation',
      'Check for typos in keywords like "class", "interface", or relationship operators',
      'Ensure proper line endings and spacing'
    ]
  },
  {
    pattern: /Lexical error on line (\d+)/i,
    type: 'syntax' as const,
    getMessage: (match: RegExpMatchArray) => 
      `Invalid characters or tokens on line ${match[1]}.`,
    suggestions: [
      'Remove any invalid characters or symbols',
      'Check for proper encoding of special characters',
      'Ensure all text is properly quoted if it contains spaces'
    ]
  },
  {
    pattern: /Maximum call stack size exceeded/i,
    type: 'rendering' as const,
    getMessage: () => 'Diagram is too complex or contains circular references.',
    suggestions: [
      'Simplify your diagram by breaking it into smaller parts',
      'Check for circular inheritance or relationship loops',
      'Reduce the number of classes or relationships'
    ]
  },
  {
    pattern: /Cannot read propert/i,
    type: 'rendering' as const,
    getMessage: () => 'Internal rendering error occurred.',
    suggestions: [
      'Try refreshing the page',
      'Check if your diagram syntax is valid',
      'Simplify the diagram and try again'
    ]
  }
];

/**
 * Storage error patterns
 */
const STORAGE_ERROR_PATTERNS = [
  {
    pattern: /QuotaExceededError|NS_ERROR_DOM_QUOTA_REACHED/i,
    getMessage: () => 'Browser storage is full. Some features may not work properly.',
    suggestions: [
      'Clear browser data for this site',
      'Use a smaller diagram',
      'Export your work before continuing'
    ]
  },
  {
    pattern: /SecurityError.*localStorage/i,
    getMessage: () => 'Browser storage is not available (private browsing mode?).',
    suggestions: [
      'Disable private browsing mode',
      'Check browser security settings',
      'Your work will not be automatically saved'
    ]
  }
];

/**
 * Export error patterns
 */
const EXPORT_ERROR_PATTERNS = [
  {
    pattern: /Failed to execute 'toBlob'/i,
    getMessage: () => 'Cannot export diagram. Browser may not support this feature.',
    suggestions: [
      'Try using a different browser',
      'Update your browser to the latest version',
      'Try exporting as SVG instead'
    ]
  },
  {
    pattern: /Network error|Failed to fetch/i,
    getMessage: () => 'Network error occurred during export.',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Save your work locally first'
    ]
  }
];

/**
 * Parse and categorize errors
 */
export function parseError(error: Error | string, context?: Record<string, unknown>): ErrorDetails {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const originalError = typeof error === 'string' ? undefined : error;

  // Check Mermaid syntax errors
  for (const pattern of MERMAID_ERROR_PATTERNS) {
    const match = errorMessage.match(pattern.pattern);
    if (match) {
      return {
        type: pattern.type,
        message: pattern.getMessage(match),
        originalError,
        context,
        suggestions: pattern.suggestions,
        recoverable: true
      };
    }
  }

  // Check storage errors
  for (const pattern of STORAGE_ERROR_PATTERNS) {
    const match = errorMessage.match(pattern.pattern);
    if (match) {
      return {
        type: 'storage',
        message: pattern.getMessage(),
        originalError,
        context,
        suggestions: pattern.suggestions,
        recoverable: true
      };
    }
  }

  // Check export errors
  for (const pattern of EXPORT_ERROR_PATTERNS) {
    const match = errorMessage.match(pattern.pattern);
    if (match) {
      return {
        type: 'export',
        message: pattern.getMessage(),
        originalError,
        context,
        suggestions: pattern.suggestions,
        recoverable: true
      };
    }
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: errorMessage || 'An unexpected error occurred',
    originalError,
    context,
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ],
    recoverable: false
  };
}

/**
 * Validate Mermaid syntax
 */
export function validateMermaidSyntax(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || !content.trim()) {
    return { isValid: true, errors, warnings };
  }

  const lines = content.split('\n');

  // Check for basic syntax issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    if (!line || line.startsWith('%%')) {
      continue; // Skip empty lines and comments
    }

    // Check for unmatched brackets
    const openBrackets = (line.match(/[{([]/g) || []).length;
    const closeBrackets = (line.match(/[})\]]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      warnings.push(`Line ${lineNumber}: Unmatched brackets detected`);
    }

    // Check for invalid characters in class names
    const classMatch = line.match(/class\s+([^\s{]+)/);
    if (classMatch) {
      const className = classMatch[1];
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(className)) {
        errors.push(`Line ${lineNumber}: Invalid class name "${className}". Use only letters, numbers, and underscores.`);
      }
    }

    // Check for common relationship syntax errors
    if (line.includes('-->') || line.includes('<--') || line.includes('<|--') || line.includes('--|>')) {
      const relationshipPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\s*(<\|--|--\||<--|-->|\*--|--\*|o--|--o)\s*[a-zA-Z_][a-zA-Z0-9_]*$/;
      if (!relationshipPattern.test(line)) {
        warnings.push(`Line ${lineNumber}: Relationship syntax may be incorrect`);
      }
    }
  }

  // Check for diagram type declaration
  const hasClassDiagram = content.includes('classDiagram') || 
                         lines.some(line => line.trim().startsWith('class '));
  
  if (!hasClassDiagram && content.trim()) {
    warnings.push('No class diagram declaration found. Consider starting with "classDiagram"');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate user input for edge cases
 */
export function validateUserInput(input: string, maxLength = 50000): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check input length
  if (input.length > maxLength) {
    errors.push(`Content is too long (${input.length} characters). Maximum allowed is ${maxLength}.`);
  }

  // Check for potentially problematic content
  if (input.length > maxLength * 0.8) {
    warnings.push('Large diagram detected. This may affect performance.');
  }

  // Check for excessive nesting
  const maxNestingLevel = 10;
  const nestingLevel = Math.max(
    (input.match(/{/g) || []).length,
    (input.match(/\(/g) || []).length
  );
  
  if (nestingLevel > maxNestingLevel) {
    warnings.push('Deep nesting detected. This may cause rendering issues.');
  }

  // Check for suspicious patterns that might cause infinite loops
  const suspiciousPatterns = [
    /(\w+)\s*<\|--\s*\1/, // Self-inheritance
    /(\w+)\s*-->\s*\1/,   // Self-reference
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      warnings.push('Potential circular reference detected. This may cause rendering issues.');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Attempt to fix common syntax errors
   */
  static attemptSyntaxFix(content: string): { fixed: string; changes: string[] } {
    let fixed = content;
    const changes: string[] = [];

    // Fix missing classDiagram declaration
    if (!fixed.includes('classDiagram') && fixed.trim()) {
      fixed = 'classDiagram\n' + fixed;
      changes.push('Added missing classDiagram declaration');
    }

    // Fix common relationship syntax errors
    fixed = fixed.replace(/(\w+)\s*->\s*(\w+)/g, '$1 --> $2');
    if (fixed !== content) {
      changes.push('Fixed relationship arrow syntax');
    }

    // Remove invalid characters from class names
    fixed = fixed.replace(/class\s+([^\s{]+)/g, (match, className) => {
      const cleanName = className.replace(/[^a-zA-Z0-9_]/g, '_');
      if (cleanName !== className) {
        changes.push(`Cleaned class name: ${className} → ${cleanName}`);
        return `class ${cleanName}`;
      }
      return match;
    });

    return { fixed, changes };
  }

  /**
   * Create a minimal valid diagram from invalid content
   */
  static createFallbackDiagram(originalContent: string): string {
    return `classDiagram
    class ErrorRecovery {
        +message: string
        +originalContent: string
        +getHelp()
    }
    
    %% Original content had syntax errors
    %% ${originalContent.split('\n').slice(0, 3).join(' ').substring(0, 100)}...`;
  }

  /**
   * Suggest fixes for common errors
   */
  static suggestFixes(errorDetails: ErrorDetails): string[] {
    const suggestions = [...(errorDetails.suggestions || [])];

    // Add context-specific suggestions
    if (errorDetails.type === 'syntax') {
      suggestions.push(
        'Use the helper panel templates for correct syntax',
        'Check the Mermaid documentation for class diagram syntax'
      );
    }

    if (errorDetails.type === 'rendering') {
      suggestions.push(
        'Try reducing the complexity of your diagram',
        'Break large diagrams into smaller, focused sections'
      );
    }

    return suggestions;
  }
}

/**
 * Performance monitoring for error tracking
 */
export class ErrorMetrics {
  private static errorCounts: Record<string, number> = {};
  private static lastErrors: ErrorDetails[] = [];

  static recordError(error: ErrorDetails): void {
    const key = `${error.type}:${error.message.substring(0, 50)}`;
    this.errorCounts[key] = (this.errorCounts[key] || 0) + 1;
    
    this.lastErrors.unshift(error);
    if (this.lastErrors.length > 10) {
      this.lastErrors.pop();
    }

    // Log frequent errors
    if (this.errorCounts[key] > 3) {
      console.warn(`Frequent error detected (${this.errorCounts[key]} times):`, error);
    }
  }

  static getErrorStats(): { counts: Record<string, number>; recent: ErrorDetails[] } {
    return {
      counts: { ...this.errorCounts },
      recent: [...this.lastErrors]
    };
  }

  static clearStats(): void {
    this.errorCounts = {};
    this.lastErrors = [];
  }
}

/**
 * Main error handler function
 */
export function handleError(
  error: Error | string,
  context?: Record<string, unknown>
): ErrorDetails {
  const errorDetails = parseError(error, context);
  
  // Record error for metrics
  ErrorMetrics.recordError(errorDetails);
  
  // Log error details
  console.error('Error handled:', errorDetails);
  
  return errorDetails;
}

/**
 * Async operation wrapper with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: ErrorDetails }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errorDetails = handleError(error as Error, context);
    return { success: false, error: errorDetails };
  }
}

/**
 * Retry mechanism for recoverable errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      const errorDetails = parseError(lastError);
      if (!errorDetails.recoverable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}