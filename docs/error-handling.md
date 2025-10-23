# Error Handling System

This document describes the comprehensive error handling and user feedback system implemented for the Mermaid UML Editor.

## Recent Improvements (v2.0)

### Fixed Empty Error Object Issues

- **Problem**: Console was showing "Error handled: {}" and "Mermaid render error: {}" for empty or malformed error objects
- **Solution**: Enhanced error parsing to handle null, undefined, and empty objects gracefully
- **Specific Fixes**:
  - Added checks for empty objects, null, undefined, and meaningless strings like "[object Object]"
  - Improved Mermaid-specific error handling with nested try-catch blocks
  - Enhanced global error handlers to filter out empty error objects
  - Added meaningful fallback messages for debugging
- **Impact**: Cleaner console output and better error tracking

### Enhanced Global Error Handlers

- **Improvement**: Better handling of window error events and unhandled promise rejections
- **Details**: Now properly extracts meaningful information from error events
- **Benefit**: More informative error logs for debugging

### Robust Mermaid Rendering Error Handling

- **Enhancement**: Improved error handling in diagram rendering pipeline
- **Features**: Better error context and fallback mechanisms
- **Result**: More reliable diagram preview with clearer error messages

## Overview

The error handling system provides:

- **Component-level error boundaries** for graceful failure recovery
- **User-friendly error messages** for Mermaid syntax errors
- **Loading indicators** for all async operations
- **Input validation** for user inputs and edge cases
- **Error recovery mechanisms** with automatic fixes
- **Performance monitoring** and error metrics

## Components

### 1. ErrorBoundary Component

**Location**: `components/ErrorBoundary.tsx`

React error boundary that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Features**:

- Catches and logs component errors
- Provides retry and reload functionality
- Shows detailed error information in development
- Reports errors to tracking services in production

**Usage**:

```tsx
<ErrorBoundary onError={(error, errorInfo) => console.log(error)}>
  <YourComponent />
</ErrorBoundary>
```

### 2. Error Handling Utilities

**Location**: `lib/error-handling.ts`

Core utilities for parsing, categorizing, and handling different types of errors.

**Key Functions**:

#### `parseError(error, context?)`

Parses and categorizes errors into specific types:

- `syntax` - Mermaid syntax errors
- `rendering` - Diagram rendering errors
- `export` - File export errors
- `storage` - Browser storage errors
- `network` - Network-related errors
- `validation` - Input validation errors
- `unknown` - Unrecognized errors

#### `validateMermaidSyntax(content)`

Validates Mermaid diagram syntax and returns:

- `isValid` - Whether the syntax is valid
- `errors` - Array of syntax errors
- `warnings` - Array of potential issues

#### `validateUserInput(input, maxLength?)`

Validates user input for edge cases:

- Content length limits
- Excessive nesting detection
- Circular reference detection

#### `ErrorRecovery.attemptSyntaxFix(content)`

Attempts to automatically fix common syntax errors:

- Adds missing `classDiagram` declaration
- Fixes relationship arrow syntax
- Cleans invalid class names

### 3. Loading Indicators

**Location**: `components/LoadingIndicator.tsx`

Provides various loading states and indicators for better user feedback.

**Components**:

- `LoadingIndicator` - Basic loading spinner/animation
- `EditorLoadingIndicator` - Specialized for editor loading
- `PreviewLoadingIndicator` - For diagram rendering
- `ExportLoadingIndicator` - For export operations
- `LoadingOverlay` - Full-screen loading overlay

**Hook**:

```tsx
const { isLoading, startLoading, stopLoading, withLoading } = useLoadingState();
```

### 4. Error Display Components

**Location**: `components/ErrorDisplay.tsx`

User-friendly error display components with actionable feedback.

**Features**:

- Type-specific error icons and styling
- Suggested fixes and recovery actions
- Auto-fix functionality for syntax errors
- Expandable technical details (development only)
- Compact and full display modes

**Specialized Components**:

- `SyntaxErrorDisplay` - For Mermaid syntax errors
- `ExportErrorDisplay` - For export failures
- `StorageErrorDisplay` - For storage issues

## Error Types and Handling

### Syntax Errors

**Common Patterns**:

- `Parse error on line X` - Syntax parsing failures
- `Expecting X got Y` - Unexpected tokens
- `Lexical error on line X` - Invalid characters

**Handling**:

- Real-time syntax validation
- User-friendly error messages
- Automatic fix suggestions
- Template insertion for correct syntax

### Rendering Errors

**Common Patterns**:

- `Maximum call stack size exceeded` - Complex diagrams
- `Cannot read property` - Internal rendering issues

**Handling**:

- Complexity detection and warnings
- Graceful fallback to error display
- Suggestions to simplify diagrams

### Export Errors

**Common Patterns**:

- `Failed to execute 'toBlob'` - Browser compatibility
- `Network error` - Connection issues

**Handling**:

- Browser capability detection
- Alternative export methods
- Clear error messages with solutions

### Storage Errors

**Common Patterns**:

- `QuotaExceededError` - Storage full
- `SecurityError` - Private browsing mode

**Handling**:

- Storage availability detection
- Graceful degradation when unavailable
- User notifications about storage issues

## Integration Points

### PreviewPanel Integration

The PreviewPanel component integrates error handling for:

- Mermaid syntax validation before rendering
- Rendering error capture and display
- Loading state management
- User-friendly error messages

### Export Functions Integration

Export utilities include comprehensive error handling:

- Input validation
- Browser capability checks
- Detailed error messages
- Recovery suggestions

### State Management Integration

The AppStateProvider includes error handling for:

- localStorage operations
- State validation
- Initialization errors
- Preference loading/saving

## Error Recovery Strategies

### Automatic Fixes

1. **Missing classDiagram Declaration**

   ```
   Before: class User { ... }
   After:  classDiagram\nclass User { ... }
   ```

2. **Relationship Syntax**

   ```
   Before: User -> Order
   After:  User --> Order
   ```

3. **Invalid Class Names**
   ```
   Before: class User-Name
   After:  class User_Name
   ```

### Fallback Mechanisms

1. **Syntax Errors**: Display error with suggestions
2. **Rendering Failures**: Show fallback error diagram
3. **Component Crashes**: Error boundary with retry option
4. **Storage Issues**: Continue without persistence

## Performance Monitoring

### Error Metrics

The `ErrorMetrics` class tracks:

- Error frequency and patterns
- Recent error history
- Performance impact
- User recovery success rates

### Usage Analytics

In production, errors are:

- Categorized and counted
- Reported to monitoring services
- Used to improve error messages
- Analyzed for pattern detection

## Testing

### Manual Testing Scenarios

1. **Syntax Errors**:

   - Enter invalid Mermaid syntax
   - Verify error display and suggestions
   - Test auto-fix functionality

2. **Export Errors**:

   - Try exporting without a diagram
   - Test in browsers with limited support
   - Verify error messages and alternatives

3. **Component Errors**:

   - Trigger JavaScript errors
   - Verify error boundary activation
   - Test retry and reload functionality

4. **Storage Errors**:
   - Fill browser storage quota
   - Test in private browsing mode
   - Verify graceful degradation

### Automated Testing

Run the test script:

```bash
node scripts/test-error-handling.js
```

This tests:

- Error parsing and categorization
- Syntax validation
- Error recovery mechanisms
- Metrics collection
- Async error handling

## Best Practices

### For Developers

1. **Always use error boundaries** around major components
2. **Validate user input** before processing
3. **Provide actionable error messages** with clear next steps
4. **Test error scenarios** during development
5. **Monitor error patterns** in production

### For Users

1. **Check syntax** using helper panel templates
2. **Simplify complex diagrams** if rendering fails
3. **Update browser** for better export support
4. **Clear storage** if quota exceeded
5. **Report persistent issues** for investigation

## Configuration

### Error Reporting

To integrate with error tracking services, update the `ErrorBoundary` component:

```tsx
// In production, replace console.warn with actual reporting
if (process.env.NODE_ENV === "production") {
  // Send to Sentry, LogRocket, etc.
  errorTrackingService.captureException(error, {
    extra: errorInfo,
    tags: { component: "ErrorBoundary" },
  });
}
```

### Validation Limits

Adjust validation limits in `validateUserInput`:

```typescript
const MAX_CONTENT_LENGTH = 50000; // Adjust as needed
const MAX_NESTING_LEVEL = 10; // Adjust as needed
```

### Error Messages

Customize error messages in `MERMAID_ERROR_PATTERNS`:

```typescript
{
  pattern: /Your custom pattern/i,
  type: 'syntax',
  getMessage: (match) => 'Your custom message',
  suggestions: ['Your suggestions']
}
```

## Future Enhancements

1. **AI-Powered Error Fixes**: Use LLM to suggest complex fixes
2. **Interactive Error Tutorials**: Guide users through error resolution
3. **Error Pattern Learning**: Improve suggestions based on user behavior
4. **Real-time Collaboration**: Handle multi-user error scenarios
5. **Advanced Metrics**: Detailed performance and user experience tracking
