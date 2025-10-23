/**
 * Tests for error handling utilities
 */

import {
  parseError,
  validateMermaidSyntax,
  validateUserInput,
  ErrorRecovery,
  ErrorMetrics,
  handleError,
  withErrorHandling,
  withRetry
} from '../error-handling';

describe('Error Handling', () => {
  beforeEach(() => {
    ErrorMetrics.clearStats();
  });

  describe('parseError', () => {
    it('should parse Mermaid syntax errors correctly', () => {
      const error = new Error('Parse error on line 5');
      const result = parseError(error);
      
      expect(result.type).toBe('syntax');
      expect(result.message).toContain('line 5');
      expect(result.suggestions).toBeDefined();
      expect(result.recoverable).toBe(true);
    });

    it('should parse rendering errors correctly', () => {
      const error = new Error('Maximum call stack size exceeded');
      const result = parseError(error);
      
      expect(result.type).toBe('rendering');
      expect(result.message).toContain('too complex');
      expect(result.suggestions).toBeDefined();
      expect(result.recoverable).toBe(true);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Some unknown error');
      const result = parseError(error);
      
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('Some unknown error');
      expect(result.recoverable).toBe(false);
    });

    it('should handle string errors', () => {
      const result = parseError('String error message');
      
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('String error message');
      expect(result.originalError).toBeUndefined();
    });
  });

  describe('validateMermaidSyntax', () => {
    it('should validate correct class diagram syntax', () => {
      const content = `classDiagram
        class User {
          +name: string
          +email: string
          +login()
        }`;
      
      const result = validateMermaidSyntax(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid class names', () => {
      const content = `classDiagram
        class 123Invalid {
          +method()
        }`;
      
      const result = validateMermaidSyntax(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Invalid class name'));
    });

    it('should warn about unmatched brackets', () => {
      const content = `classDiagram
        class User {
          +method(
        }`;
      
      const result = validateMermaidSyntax(content);
      expect(result.warnings).toContain(expect.stringContaining('Unmatched brackets'));
    });

    it('should handle empty content', () => {
      const result = validateMermaidSyntax('');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about missing classDiagram declaration', () => {
      const content = `class User {
        +name: string
      }`;
      
      const result = validateMermaidSyntax(content);
      expect(result.warnings).toContain(expect.stringContaining('No class diagram declaration'));
    });
  });

  describe('validateUserInput', () => {
    it('should validate normal input', () => {
      const content = 'classDiagram\nclass User';
      const result = validateUserInput(content);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject content that is too long', () => {
      const content = 'a'.repeat(60000);
      const result = validateUserInput(content, 50000);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('too long'));
    });

    it('should warn about large content', () => {
      const content = 'a'.repeat(45000);
      const result = validateUserInput(content, 50000);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('Large diagram'));
    });

    it('should detect potential circular references', () => {
      const content = 'User <|-- User';
      const result = validateUserInput(content);
      
      expect(result.warnings).toContain(expect.stringContaining('circular reference'));
    });
  });

  describe('ErrorRecovery', () => {
    it('should fix missing classDiagram declaration', () => {
      const content = `class User {
        +name: string
      }`;
      
      const { fixed, changes } = ErrorRecovery.attemptSyntaxFix(content);
      
      expect(fixed).toContain('classDiagram');
      expect(changes).toContain('Added missing classDiagram declaration');
    });

    it('should fix relationship arrow syntax', () => {
      const content = 'User -> Order';
      const { fixed, changes } = ErrorRecovery.attemptSyntaxFix(content);
      
      expect(fixed).toContain('User --> Order');
      expect(changes).toContain('Fixed relationship arrow syntax');
    });

    it('should clean invalid class names', () => {
      const content = 'class User-Name';
      const { fixed, changes } = ErrorRecovery.attemptSyntaxFix(content);
      
      expect(fixed).toContain('User_Name');
      expect(changes).toContain(expect.stringContaining('Cleaned class name'));
    });

    it('should create fallback diagram', () => {
      const content = 'invalid syntax here';
      const fallback = ErrorRecovery.createFallbackDiagram(content);
      
      expect(fallback).toContain('classDiagram');
      expect(fallback).toContain('ErrorRecovery');
      expect(fallback).toContain('invalid syntax');
    });
  });

  describe('ErrorMetrics', () => {
    it('should record and track errors', () => {
      const error1 = { type: 'syntax' as const, message: 'Test error', recoverable: true };
      const error2 = { type: 'syntax' as const, message: 'Test error', recoverable: true };
      
      ErrorMetrics.recordError(error1);
      ErrorMetrics.recordError(error2);
      
      const stats = ErrorMetrics.getErrorStats();
      expect(stats.recent).toHaveLength(2);
      expect(Object.keys(stats.counts)).toHaveLength(1);
    });

    it('should limit recent errors to 10', () => {
      for (let i = 0; i < 15; i++) {
        ErrorMetrics.recordError({
          type: 'syntax',
          message: `Error ${i}`,
          recoverable: true
        });
      }
      
      const stats = ErrorMetrics.getErrorStats();
      expect(stats.recent).toHaveLength(10);
    });
  });

  describe('withErrorHandling', () => {
    it('should handle successful operations', async () => {
      const operation = async () => 'success';
      const result = await withErrorHandling(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.error).toBeUndefined();
    });

    it('should handle failed operations', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };
      
      const result = await withErrorHandling(operation, { test: 'context' });
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Test error');
      expect(result.error!.context).toEqual({ test: 'context' });
    });
  });

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await withRetry(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on recoverable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(withRetry(operation, 2, 10)).rejects.toThrow('Persistent error');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-recoverable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Fatal error'));
      
      // Mock parseError to return non-recoverable error
      jest.doMock('../error-handling', () => ({
        ...jest.requireActual('../error-handling'),
        parseError: () => ({ recoverable: false })
      }));
      
      await expect(withRetry(operation, 3, 10)).rejects.toThrow('Fatal error');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleError', () => {
    it('should parse and record errors', () => {
      const error = new Error('Test error');
      const context = { operation: 'test' };
      
      const result = handleError(error, context);
      
      expect(result.message).toBe('Test error');
      expect(result.context).toBe(context);
      
      const stats = ErrorMetrics.getErrorStats();
      expect(stats.recent).toHaveLength(1);
    });
  });
});

// Integration tests
describe('Error Handling Integration', () => {
  it('should handle complete error flow', async () => {
    const mockOperation = async () => {
      throw new Error('Parse error on line 3');
    };
    
    const result = await withErrorHandling(mockOperation, {
      operation: 'mermaid-render',
      content: 'invalid syntax'
    });
    
    expect(result.success).toBe(false);
    expect(result.error!.type).toBe('syntax');
    expect(result.error!.suggestions).toBeDefined();
    expect(result.error!.recoverable).toBe(true);
    
    const stats = ErrorMetrics.getErrorStats();
    expect(stats.recent).toHaveLength(1);
  });

  it('should provide recovery suggestions', () => {
    const error = parseError(new Error('Parse error on line 1'));
    const suggestions = ErrorRecovery.suggestFixes(error);
    
    expect(suggestions).toContain('Use the helper panel templates for correct syntax');
    expect(suggestions.length).toBeGreaterThan(0);
  });
});