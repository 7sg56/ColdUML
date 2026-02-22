import { formatMermaidCode } from './editor-utils';

describe('formatMermaidCode', () => {
  test('should return empty string for empty input', () => {
    expect(formatMermaidCode('')).toBe('');
  });

  test('should handle simple code without indentation', () => {
    const input = 'graph TD\nA-->B';
    const expected = 'graph TD\nA-->B';
    expect(formatMermaidCode(input)).toBe(expected);
  });

  test('should indent after opening brace', () => {
    const input = 'subgraph A {\nA-->B\n}';
    const expected = 'subgraph A {\n  A-->B\n}';
    expect(formatMermaidCode(input)).toBe(expected);
  });

  test('should handle nested indentation', () => {
    const input = 'subgraph A {\nsubgraph B {\nB-->C\n}\n}';
    const expected = 'subgraph A {\n  subgraph B {\n    B-->C\n  }\n}';
    expect(formatMermaidCode(input)).toBe(expected);
  });

  test('should indent after class definition', () => {
    const input = 'class MyClass {\n+method()\n}';
    const expected = 'class MyClass {\n  +method()\n}';
    expect(formatMermaidCode(input)).toBe(expected);
  });

  test('should handle mixed content', () => {
    const input = `graph TD
subgraph One {
A-->B
}
subgraph Two {
C-->D
}`;
    const expected = `graph TD
subgraph One {
  A-->B
}
subgraph Two {
  C-->D
}`;
    expect(formatMermaidCode(input)).toBe(expected);
  });

  test('should handle empty lines correctly', () => {
    const input = 'subgraph A {\n\n  B-->C\n\n}';
    const expected = 'subgraph A {\n\n  B-->C\n\n}';
    expect(formatMermaidCode(input)).toBe(expected);
  });

  test('should not indent incorrectly for single lines', () => {
      const input = 'classDef default fill:#f9f,stroke:#333,stroke-width:4px;';
      const expected = 'classDef default fill:#f9f,stroke:#333,stroke-width:4px;';
      expect(formatMermaidCode(input)).toBe(expected);
  });

  test('should handle existing indentation by replacing it', () => {
      const input = 'subgraph A {\n      B-->C\n}';
      const expected = 'subgraph A {\n  B-->C\n}';
      expect(formatMermaidCode(input)).toBe(expected);
  });
});
