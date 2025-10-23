'use client';

import { useState } from 'react';

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
  const [focusedIndex, setFocusedIndex] = useState<number>(-1); // eslint-disable-line @typescript-eslint/no-unused-vars

  const handleTemplateClick = (template: UMLTemplate) => {
    // Simple template insertion using the callback
    onInsertTemplate(template.template);
  };

  const handleKeyDown = (event: React.KeyboardEvent, template: UMLTemplate, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTemplateClick(template);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (index + 1) % UML_TEMPLATES.length;
      setFocusedIndex(nextIndex);
      // Focus the next button
      const nextButton = document.querySelector(`[data-template-index="${nextIndex}"]`) as HTMLButtonElement;
      nextButton?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = index === 0 ? UML_TEMPLATES.length - 1 : index - 1;
      setFocusedIndex(prevIndex);
      // Focus the previous button
      const prevButton = document.querySelector(`[data-template-index="${prevIndex}"]`) as HTMLButtonElement;
      prevButton?.focus();
    }
  };

  return (
    <div className="h-full flex flex-col bg-panel-background p-2 sm:p-3 xl:p-4">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          <span className="hidden sm:inline">UML Templates</span>
          <span className="sm:hidden">Templates</span>
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {UML_TEMPLATES.length}
        </span>
      </div>
      
      <div className="responsive-grid flex-1" role="group" aria-label="UML template buttons">
        {UML_TEMPLATES.map((template, index) => (
          <button
            key={template.id}
            data-template-index={index}
            onClick={() => handleTemplateClick(template)}
            onKeyDown={(e) => handleKeyDown(e, template, index)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
            className="group relative px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-button-background hover:bg-button-hover border border-border focus:outline-none focus:ring-2 focus:ring-ring rounded-md transition-colors text-left"
            title={template.description}
            aria-label={`Insert ${template.label} template: ${template.description}`}
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground group-hover:text-accent-foreground transition-colors truncate">
                {template.label}
              </span>
              <div className="flex items-center gap-1 ml-1">
                {KEYBOARD_SHORTCUTS[template.id] && (
                  <kbd className="hidden xl:inline px-1 py-0.5 text-xs font-mono bg-muted border border-border rounded opacity-60 group-hover:opacity-100 transition-opacity">
                    {KEYBOARD_SHORTCUTS[template.id]}
                  </kbd>
                )}
                <svg
                  className="w-3 h-3 text-muted-foreground group-hover:text-accent-foreground transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
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
            
            {/* Tooltip for desktop - only show when helper panel is on the side */}
            {hoveredTemplate === template.id && (
              <div className="absolute z-10 left-full ml-2 top-0 bg-popover border border-border rounded-md shadow-lg p-2 min-w-[200px] hidden xl:block">
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
      
      {/* Keyboard shortcuts hint - only show when helper panel is on the side */}
      <div className="hidden xl:block mt-auto pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 font-mono bg-muted border border-border rounded">
              Click
            </kbd>
            <span>Insert template</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 font-mono bg-muted border border-border rounded">
              ⌘1-5
            </kbd>
            <span>Quick insert</span>
          </div>
        </div>
      </div>
    </div>
  );
}