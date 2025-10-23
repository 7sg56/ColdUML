'use client';

import { useState } from 'react';
import { useEditorState } from './AppStateProvider';

export interface UMLTemplate {
  id: string;
  label: string;
  template: string;
  description: string;
}

interface HelperPanelProps {
  onInsertTemplate: (template: string) => void;
}

// UML Template Library as defined in the design document
const UML_TEMPLATES: UMLTemplate[] = [
  {
    id: 'new-class',
    label: 'New Class',
    template: `class ClassName {
    +publicMethod()
    -privateAttribute
    #protectedMethod()
}`,
    description: 'Insert a new class with example methods and attributes'
  },
  {
    id: 'inheritance',
    label: 'Inheritance',
    template: 'Parent <|-- Child',
    description: 'Create inheritance relationship'
  },
  {
    id: 'association',
    label: 'Association',
    template: 'ClassA --> ClassB',
    description: 'Create association relationship'
  },
  {
    id: 'composition',
    label: 'Composition',
    template: 'ClassA *-- ClassB',
    description: 'Create composition relationship'
  },
  {
    id: 'aggregation',
    label: 'Aggregation',
    template: 'ClassA o-- ClassB',
    description: 'Create aggregation relationship'
  }
];

// Keyboard shortcuts mapping
const KEYBOARD_SHORTCUTS: Record<string, string> = {
  'new-class': '⌘1',
  'inheritance': '⌘2',
  'association': '⌘3',
  'composition': '⌘4',
  'aggregation': '⌘5'
};

export default function HelperPanel({ onInsertTemplate }: HelperPanelProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const { insertTemplate } = useEditorState();

  const handleTemplateClick = (template: UMLTemplate) => {
    // Use centralized template insertion
    insertTemplate(template.template);
    // Also call the prop callback for backward compatibility
    onInsertTemplate(template.template);
  };

  const handleKeyDown = (event: React.KeyboardEvent, template: UMLTemplate) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTemplateClick(template);
    }
  };

  return (
    <div className="bg-panel-background border-b lg:border-b-0 lg:border-r border-panel-border p-4 lg:w-64 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">UML Templates</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {UML_TEMPLATES.length}
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
        {UML_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            onKeyDown={(e) => handleKeyDown(e, template)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            className="group relative px-3 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            title={template.description}
            aria-label={`Insert ${template.label} template: ${template.description}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground group-hover:text-accent-foreground transition-colors">
                {template.label}
              </span>
              <div className="flex items-center gap-1">
                {KEYBOARD_SHORTCUTS[template.id] && (
                  <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border border-border rounded opacity-60 group-hover:opacity-100 transition-opacity">
                    {KEYBOARD_SHORTCUTS[template.id]}
                  </kbd>
                )}
                <svg
                  className="w-3 h-3 text-muted-foreground group-hover:text-accent-foreground transition-colors opacity-0 group-hover:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>
            
            {/* Tooltip for desktop */}
            {hoveredTemplate === template.id && (
              <div className="absolute z-10 left-full ml-2 top-0 bg-popover border border-border rounded-md shadow-lg p-2 min-w-[200px] hidden lg:block">
                <div className="text-xs font-medium text-popover-foreground mb-1">
                  {template.label}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {template.description}
                </div>
                <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground whitespace-pre-wrap">
                  {template.template}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
              Click
            </kbd>
            <span>Insert template</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
              Cmd+1-5
            </kbd>
            <span>Quick insert</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
              Enter
            </kbd>
            <span>Insert when focused</span>
          </div>
        </div>
      </div>
    </div>
  );
}