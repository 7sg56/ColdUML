/**
 * Test utilities for state management validation
 * Used to verify proper data flow and state persistence
 */

import { AppState, AppStorage, StateValidator, TemplateManager } from './app-state';

export interface StateTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export class StateTestUtils {
  /**
   * Test localStorage functionality
   */
  static testLocalStorage(): StateTestResult {
    try {
      if (!AppStorage.isStorageAvailable()) {
        return {
          success: false,
          message: 'localStorage is not available in this environment'
        };
      }

      // Test content save/load
      const testContent = 'classDiagram\n    class Test';
      AppStorage.saveEditorContent(testContent);
      const loadedContent = AppStorage.loadEditorContent();
      
      if (loadedContent !== testContent) {
        return {
          success: false,
          message: 'Content save/load test failed',
          details: { expected: testContent, actual: loadedContent }
        };
      }

      // Test theme save/load
      AppStorage.saveTheme('dark');
      const loadedTheme = AppStorage.loadTheme();
      
      if (loadedTheme !== 'dark') {
        return {
          success: false,
          message: 'Theme save/load test failed',
          details: { expected: 'dark', actual: loadedTheme }
        };
      }

      // Test preferences save/load
      const testPreferences = {
        autoSave: true,
        debounceDelay: 500,
        fontSize: 16,
        wordWrap: true,
        minimap: true,
        lineNumbers: true,
        defaultTemplate: 'test'
      };
      
      AppStorage.savePreferences(testPreferences);
      const loadedPreferences = AppStorage.loadPreferences();
      
      if (!loadedPreferences || JSON.stringify(loadedPreferences) !== JSON.stringify(testPreferences)) {
        return {
          success: false,
          message: 'Preferences save/load test failed',
          details: { expected: testPreferences, actual: loadedPreferences }
        };
      }

      return {
        success: true,
        message: 'All localStorage tests passed'
      };
    } catch (error) {
      return {
        success: false,
        message: `localStorage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Test state validation
   */
  static testStateValidation(): StateTestResult {
    try {
      // Test valid content
      const validContent = 'classDiagram\n    class Test';
      if (!StateValidator.validateEditorContent(validContent)) {
        return {
          success: false,
          message: 'Valid content validation failed'
        };
      }

      // Test invalid content (too large)
      const invalidContent = 'x'.repeat(200000); // 200KB
      if (StateValidator.validateEditorContent(invalidContent)) {
        return {
          success: false,
          message: 'Invalid content validation should have failed'
        };
      }

      // Test valid theme
      if (!StateValidator.validateTheme('light') || !StateValidator.validateTheme('dark')) {
        return {
          success: false,
          message: 'Valid theme validation failed'
        };
      }

      // Test invalid theme
      if (StateValidator.validateTheme('invalid' as 'light')) {
        return {
          success: false,
          message: 'Invalid theme validation should have failed'
        };
      }

      // Test valid preferences
      const validPreferences = {
        autoSave: true,
        debounceDelay: 300,
        fontSize: 14,
        wordWrap: true,
        minimap: false,
        lineNumbers: true,
        defaultTemplate: 'test'
      };
      
      if (!StateValidator.validatePreferences(validPreferences)) {
        return {
          success: false,
          message: 'Valid preferences validation failed'
        };
      }

      // Test invalid preferences
      const invalidPreferences = {
        autoSave: 'true', // should be boolean
        debounceDelay: '300', // should be number
        fontSize: 14,
        wordWrap: true,
        minimap: false,
        lineNumbers: true,
        defaultTemplate: 'test'
      };
      
      if (StateValidator.validatePreferences(invalidPreferences)) {
        return {
          success: false,
          message: 'Invalid preferences validation should have failed'
        };
      }

      return {
        success: true,
        message: 'All state validation tests passed'
      };
    } catch (error) {
      return {
        success: false,
        message: `State validation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Test template insertion
   */
  static testTemplateInsertion(): StateTestResult {
    try {
      const content = 'classDiagram\n    class Test';
      const template = 'class NewClass {\n    +method()\n}';
      const cursorPosition = content.length;

      const result = TemplateManager.insertAtCursor(content, template, cursorPosition);

      if (!result.newContent.includes(template)) {
        return {
          success: false,
          message: 'Template was not inserted into content',
          details: { content: result.newContent, template }
        };
      }

      if (result.newCursorPosition <= cursorPosition) {
        return {
          success: false,
          message: 'Cursor position was not updated correctly',
          details: { 
            originalPosition: cursorPosition, 
            newPosition: result.newCursorPosition 
          }
        };
      }

      // Test template formatting
      const formattedTemplate = TemplateManager.formatTemplate(
        'class {{className}} {\n    +{{methodName}}()\n}',
        { className: 'TestClass', methodName: 'testMethod' }
      );

      const expectedFormatted = 'class TestClass {\n    +testMethod()\n}';
      if (formattedTemplate !== expectedFormatted) {
        return {
          success: false,
          message: 'Template formatting failed',
          details: { expected: expectedFormatted, actual: formattedTemplate }
        };
      }

      return {
        success: true,
        message: 'All template insertion tests passed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Template insertion test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Run all state management tests
   */
  static runAllTests(): StateTestResult[] {
    return [
      StateTestUtils.testLocalStorage(),
      StateTestUtils.testStateValidation(),
      StateTestUtils.testTemplateInsertion()
    ];
  }

  /**
   * Get a summary of test results
   */
  static getTestSummary(results: StateTestResult[]): {
    passed: number;
    failed: number;
    total: number;
    success: boolean;
  } {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    return {
      passed,
      failed,
      total,
      success: failed === 0
    };
  }

  /**
   * Log test results to console
   */
  static logTestResults(results: StateTestResult[]): void {
    const summary = StateTestUtils.getTestSummary(results);
    
    console.group('🧪 State Management Tests');
    console.log(`📊 Summary: ${summary.passed}/${summary.total} tests passed`);
    
    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} Test ${index + 1}: ${result.message}`);
      
      if (!result.success && result.details) {
        console.log('   Details:', result.details);
      }
    });
    
    if (summary.success) {
      console.log('🎉 All tests passed!');
    } else {
      console.warn(`⚠️  ${summary.failed} test(s) failed`);
    }
    
    console.groupEnd();
  }
}

// Development helper to run tests in browser console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { testStateManagement?: () => void }).testStateManagement = () => {
    const results = StateTestUtils.runAllTests();
    StateTestUtils.logTestResults(results);
    return results;
  };
}