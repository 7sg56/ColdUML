'use client';

import { useState } from 'react';

export interface UMLTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  code: string;
}

interface UMLTemplatesProps {
  onInsertTemplate: (template: string) => void;
}

// UML Diagram Types with Sample Code
const UML_TEMPLATES: UMLTemplate[] = [
  {
    id: 'class-diagram',
    name: 'Class Diagram',
    type: 'Class Diagram',
    description: 'Object-oriented class relationships',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +move()
    }
    
    class Dog {
        +String breed
        +bark()
        +wagTail()
    }
    
    class Cat {
        +String color
        +meow()
        +purr()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`
  },
  {
    id: 'sequence-diagram',
    name: 'Sequence Diagram',
    type: 'Sequence Diagram',
    description: 'Interaction between objects over time',
    code: `sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant D as Database
    
    U->>C: Enter credentials
    C->>S: POST /login
    S->>D: Validate credentials
    D-->>S: User data
    S-->>C: JWT token
    C-->>U: Login successful`
  },
  {
    id: 'flowchart',
    name: 'Flowchart',
    type: 'Flowchart',
    description: 'Process flow and decision logic',
    code: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`
  },
  {
    id: 'state-diagram',
    name: 'State Diagram',
    type: 'State Diagram',
    description: 'Object state transitions',
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Running : Start
    Running --> Paused : Pause
    Paused --> Running : Resume
    Running --> [*] : Stop
    Paused --> [*] : Stop`
  },
  {
    id: 'gantt-chart',
    name: 'Gantt Chart',
    type: 'Gantt Chart',
    description: 'Project timeline and milestones',
    code: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Planning    :done, plan1, 2024-01-01, 2024-01-15
    Design      :done, design1, 2024-01-16, 2024-01-30
    section Phase 2
    Development :active, dev1, 2024-02-01, 2024-03-15
    Testing     :test1, 2024-03-16, 2024-03-30
    section Phase 3
    Deployment  :deploy1, 2024-04-01, 2024-04-15`
  },
];

export default function UMLTemplates({ onInsertTemplate }: UMLTemplatesProps) {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Get unique diagram types
  const diagramTypes = ['All', ...Array.from(new Set(UML_TEMPLATES.map(t => t.type)))];

  // Filter templates by selected type
  const filteredTemplates = selectedType === 'All' 
    ? UML_TEMPLATES 
    : UML_TEMPLATES.filter(t => t.type === selectedType);

  const handleTemplateClick = (template: UMLTemplate) => {
    onInsertTemplate(template.code);
  };

  return (
    <div className="h-full w-full flex flex-col bg-panel-background" style={{ margin: 0 }}>
      {/* Header */}
      <div className="p-3 border-b border-panel-border bg-header-background" style={{ margin: 0 }}>
        <h2 className="text-sm font-semibold text-foreground" style={{ margin: 0 }}>UML Diagram Types</h2>
      </div>

      {/* Templates Grid - Single Row Layout */}
      <div className="flex-1 overflow-auto p-3" style={{ margin: 0 }}>
        <div className="flex flex-wrap gap-2" style={{ margin: 0 }}>
          {UML_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="bg-button-background hover:bg-button-hover border border-border rounded px-3 py-2 text-sm font-medium text-foreground hover:text-accent-foreground transition-colors whitespace-nowrap"
              style={{ margin: 0 }}
              title={template.description}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
