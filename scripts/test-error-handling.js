/**
 * Manual test script for error handling functionality
 * Run with: node scripts/test-error-handling.js
 */

// Mock browser environment for testing
global.window = {
  innerWidth: 1024,
  location: { href: 'http://localhost:3000' }
};
global.navigator = {
  userAgent: 'Test Browser'
};
global.document = {
  fonts: { ready: Promise.resolve() },
  createElement: () => ({}),
  body: { appendChild: () => {}, removeChild: () => {} }
};

// Import error handling utilities
const {
  parseError,
  validateMermaidSyntax,
  validateUserInput,
  ErrorRecovery,
  ErrorMetrics,
  handleError,
  withErrorHandling
} = require('../lib/error-handling.ts');

console.log('🧪 Testing Error Handling System\n');

// Test 1: Parse Mermaid syntax errors
console.log('1. Testing Mermaid syntax error parsing...');
try {
  const syntaxError = new Error('Parse error on line 5');
  const parsed = parseError(syntaxError);
  console.log('✅ Syntax error parsed:', {
    type: parsed.type,
    recoverable: parsed.recoverable,
    suggestionsCount: parsed.suggestions?.length || 0
  });
} catch (error) {
  console.log('❌ Syntax error parsing failed:', error.message);
}

// Test 2: Validate Mermaid content
console.log('\n2. Testing Mermaid syntax validation...');
try {
  const validContent = `classDiagram
    class User {
      +name: string
      +login()
    }`;
  
  const invalidContent = `classDiagram
    class 123Invalid {
      +method(
    }`;

  const validResult = validateMermaidSyntax(validContent);
  const invalidResult = validateMermaidSyntax(invalidContent);
  
  console.log('✅ Valid content validation:', {
    isValid: validResult.isValid,
    errors: validResult.errors.length,
    warnings: validResult.warnings.length
  });
  
  console.log('✅ Invalid content validation:', {
    isValid: invalidResult.isValid,
    errors: invalidResult.errors.length,
    warnings: invalidResult.warnings.length
  });
} catch (error) {
  console.log('❌ Validation failed:', error.message);
}

// Test 3: Error recovery
console.log('\n3. Testing error recovery...');
try {
  const brokenContent = `class User {
    +name: string
  }
  User -> Order`;
  
  const { fixed, changes } = ErrorRecovery.attemptSyntaxFix(brokenContent);
  console.log('✅ Error recovery:', {
    changesApplied: changes.length,
    changes: changes
  });
  
  const fallback = ErrorRecovery.createFallbackDiagram(brokenContent);
  console.log('✅ Fallback diagram created:', {
    length: fallback.length,
    containsClassDiagram: fallback.includes('classDiagram')
  });
} catch (error) {
  console.log('❌ Error recovery failed:', error.message);
}

// Test 4: Error metrics
console.log('\n4. Testing error metrics...');
try {
  ErrorMetrics.clearStats();
  
  // Record some test errors
  const testErrors = [
    { type: 'syntax', message: 'Test error 1', recoverable: true },
    { type: 'syntax', message: 'Test error 1', recoverable: true }, // Duplicate
    { type: 'rendering', message: 'Test error 2', recoverable: false }
  ];
  
  testErrors.forEach(error => ErrorMetrics.recordError(error));
  
  const stats = ErrorMetrics.getErrorStats();
  console.log('✅ Error metrics:', {
    recentCount: stats.recent.length,
    uniqueErrorTypes: Object.keys(stats.counts).length
  });
} catch (error) {
  console.log('❌ Error metrics failed:', error.message);
}

// Test 5: Async error handling
console.log('\n5. Testing async error handling...');
(async () => {
  try {
    // Test successful operation
    const successResult = await withErrorHandling(async () => {
      return 'success';
    });
    
    console.log('✅ Successful operation:', {
      success: successResult.success,
      hasData: !!successResult.data
    });
    
    // Test failed operation
    const failResult = await withErrorHandling(async () => {
      throw new Error('Parse error on line 1');
    }, { operation: 'test' });
    
    console.log('✅ Failed operation handled:', {
      success: failResult.success,
      errorType: failResult.error?.type,
      hasContext: !!failResult.error?.context
    });
    
  } catch (error) {
    console.log('❌ Async error handling failed:', error.message);
  }
  
  console.log('\n🎉 Error handling tests completed!');
  console.log('\nNext steps:');
  console.log('- Start the development server: npm run dev');
  console.log('- Test error scenarios in the browser');
  console.log('- Try invalid Mermaid syntax to see error displays');
  console.log('- Test export functionality with and without diagrams');
})();