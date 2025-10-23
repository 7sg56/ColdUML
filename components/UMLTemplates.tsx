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

// UML Diagram Types - Strictly 5 Types Only
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
    id: 'use-case-diagram',
    name: 'Use Case Diagram',
    type: 'Use Case Diagram',
    description: 'System functionality from user perspective',
    code: `graph TD
    User((User)) --> Login
    User --> ViewProfile
    User --> Logout
    
    Admin((Admin)) --> ManageUsers
    Admin --> ViewReports
    
    Login --> ViewProfile
    ManageUsers --> ViewReports`
  },
  {
    id: 'sequence-diagram',
    name: 'Sequence Diagram',
    type: 'Sequence Diagram',
    description: 'Interaction between objects over time',
    code: `sequenceDiagram
    participant User
    participant System
    participant Database
    
    User->>System: Login request
    System->>Database: Check credentials
    Database-->>System: User data
    System-->>User: Login successful
    
    User->>System: View profile
    System->>Database: Get user info
    Database-->>System: Profile data
    System-->>User: Display profile`
  },
  {
    id: 'activity-diagram',
    name: 'Activity Diagram',
    type: 'Activity Diagram',
    description: 'Business process flow and workflows',
    code: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`
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
