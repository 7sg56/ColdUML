import { DiagramType } from '../types';

export interface ParsedDiagram {
  type: DiagramType | 'mixed' | 'unknown';
  mermaidSyntax: string;
  hasErrors: boolean;
  errors: string[];
}

export class DiagramParser {
  private static detectDiagramType(content: string): DiagramType | 'mixed' | 'unknown' {
    const trimmedContent = content.trim().toLowerCase();
    
    // Check for explicit Mermaid syntax
    if (trimmedContent.startsWith('classdiagram') || trimmedContent.includes('class ')) {
      return 'class';
    }
    
    if (trimmedContent.startsWith('graph ') || trimmedContent.includes('((') || trimmedContent.includes('{{')) {
      return 'usecase';
    }
    
    // Check for StarUML-style syntax patterns
    const hasClassKeywords = /\b(class|interface|abstract|extends|implements)\b/i.test(content);
    const hasUseCaseKeywords = /\b(actor|usecase|system|include|extend)\b/i.test(content);
    const hasFlowKeywords = /\b(-->|<--|<\|--|\|\|--)\b/.test(content);
    
    if (hasClassKeywords && !hasUseCaseKeywords) {
      return 'class';
    }
    
    if (hasUseCaseKeywords && !hasClassKeywords) {
      return 'usecase';
    }
    
    if (hasClassKeywords && hasUseCaseKeywords) {
      return 'mixed';
    }
    
    // Fallback detection based on common patterns
    if (/\(\([^)]+\)\)/.test(content)) { // Actor pattern
      return 'usecase';
    }
    
    if (/\{[^}]+\}/.test(content) && !/\{\{[^}]+\}\}/.test(content)) { // Class method/property pattern
      return 'class';
    }
    
    return 'unknown';
  }
  
  private static parseClassDiagram(content: string): string {
    let mermaidSyntax = 'classDiagram\n';
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('//') || line.startsWith('%') || !line) continue;
      
      // Handle class definitions
      if (line.startsWith('class ')) {
        const className = line.replace('class ', '').replace('{', '').trim();
        mermaidSyntax += `    class ${className} {\n`;
        continue;
      }
      
      // Handle class properties and methods
      if (line.includes(':') || line.includes('()')) {
        mermaidSyntax += `        ${line}\n`;
        continue;
      }
      
      // Handle relationships
      if (line.includes('extends') || line.includes('<|--') || line.includes('-->')) {
        let relationship = line;
        if (line.includes('extends')) {
          const parts = line.split('extends');
          if (parts.length === 2) {
            relationship = `${parts[1].trim()} <|-- ${parts[0].trim()}`;
          }
        }
        mermaidSyntax += `    ${relationship}\n`;
        continue;
      }
      
      // Handle closing braces
      if (line === '}') {
        mermaidSyntax += '    }\n';
        continue;
      }
      
      // Default: add line as-is
      if (line.trim()) {
        mermaidSyntax += `    ${line}\n`;
      }
    }
    
    return mermaidSyntax;
  }
  
  private static parseUseCaseDiagram(content: string): string {
    let mermaidSyntax = 'graph TD\n';
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('//') || line.startsWith('%') || !line) continue;
      
      // Handle actor definitions
      if (line.startsWith('actor ')) {
        const actorName = line.replace('actor ', '').trim();
        mermaidSyntax += `    ${actorName}((${actorName}))\n`;
        continue;
      }
      
      // Handle use case definitions
      if (line.startsWith('usecase ')) {
        const usecaseLine = line.replace('usecase ', '').trim();
        const parts = usecaseLine.split(' as ');
        if (parts.length === 2) {
          const [description, id] = parts;
          mermaidSyntax += `    ${id.trim()}["${description.replace(/"/g, '').trim()}"]\n`;
        } else {
          mermaidSyntax += `    ${usecaseLine}["${usecaseLine}"]\n`;
        }
        continue;
      }
      
      // Handle system definitions
      if (line.startsWith('system ')) {
        const systemName = line.replace('system ', '').trim();
        mermaidSyntax += `    ${systemName}{{${systemName}}}\n`;
        continue;
      }
      
      // Handle relationships (arrows)
      if (line.includes('-->') || line.includes('<--')) {
        mermaidSyntax += `    ${line}\n`;
        continue;
      }
      
      // Default: try to parse as Mermaid syntax
      if (line.trim()) {
        mermaidSyntax += `    ${line}\n`;
      }
    }
    
    return mermaidSyntax;
  }
  
  private static validateMermaidSyntax(syntax: string): { hasErrors: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic validation checks
    const lines = syntax.split('\n');
    
    // Check for diagram type declaration
    const firstLine = lines[0]?.trim();
    if (!firstLine || (!firstLine.startsWith('classDiagram') && !firstLine.startsWith('graph'))) {
      errors.push('Missing diagram type declaration (classDiagram or graph)');
    }
    
    // Check for unmatched brackets
    let braceCount = 0;
    let parenCount = 0;
    
    for (const line of lines) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      parenCount += (line.match(/\(/g) || []).length;
      parenCount -= (line.match(/\)/g) || []).length;
    }
    
    if (braceCount !== 0) {
      errors.push('Unmatched curly braces in diagram');
    }
    
    if (parenCount !== 0) {
      errors.push('Unmatched parentheses in diagram');
    }
    
    // Check for invalid characters in node names
    const nodeNameRegex = /^\s*([A-Za-z][A-Za-z0-9_]*)/;
    for (const line of lines) {
      if (line.includes('[') || line.includes('((')) {
        const match = line.match(nodeNameRegex);
        if (match && !/^[A-Za-z][A-Za-z0-9_]*$/.test(match[1])) {
          errors.push(`Invalid node name: "${match[1]}". Use only letters, numbers, and underscores.`);
        }
      }
    }
    
    return {
      hasErrors: errors.length > 0,
      errors
    };
  }
  
  static parse(content: string): ParsedDiagram {
    if (!content.trim()) {
      return {
        type: 'unknown',
        mermaidSyntax: '',
        hasErrors: false,
        errors: []
      };
    }
    
    const detectedType = this.detectDiagramType(content);
    let mermaidSyntax = '';
    
    try {
      // If content already looks like Mermaid syntax, use it directly
      if (content.trim().startsWith('classDiagram') || content.trim().startsWith('graph ')) {
        mermaidSyntax = content;
      } else {
        // Convert StarUML-style syntax to Mermaid
        switch (detectedType) {
          case 'class':
            mermaidSyntax = this.parseClassDiagram(content);
            break;
          case 'usecase':
            mermaidSyntax = this.parseUseCaseDiagram(content);
            break;
          case 'mixed':
            // For mixed diagrams, try to parse as use case first
            mermaidSyntax = this.parseUseCaseDiagram(content);
            break;
          default:
            // Fallback: assume it's a use case diagram
            mermaidSyntax = this.parseUseCaseDiagram(content);
        }
      }
      
      const validation = this.validateMermaidSyntax(mermaidSyntax);
      
      return {
        type: detectedType,
        mermaidSyntax,
        hasErrors: validation.hasErrors,
        errors: validation.errors
      };
      
    } catch (error) {
      return {
        type: detectedType,
        mermaidSyntax: content, // Fallback to original content
        hasErrors: true,
        errors: [`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}