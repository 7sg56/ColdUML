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
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Get unique diagram types
  const diagramTypes = ['All', ...Array.from(new Set(UML_TEMPLATES.map(t => t.type)))];

  // Filter templates by selected type
  const filteredTemplates = selectedType === 'All' 
    ? UML_TEMPLATES 
    : UML_TEMPLATES.filter(t => t.type === selectedType);

  const handleTemplateClick = (template: UMLTemplate) => {
    setActiveTemplate(template.id);
    onInsertTemplate(template.code);
    
    // Clear active state after a short delay
    setTimeout(() => {
      setActiveTemplate(null);
    }, 1000);
  };

  return (
    <div className="h-full w-full flex flex-col" style={{ margin: 0 }}>
      {/* Header */}
      <div className="panel-header templates-header" style={{ margin: 0 }}>
        <h2 className="panel-title" style={{ margin: 0 }}>Types</h2>
      </div>

      {/* Templates Grid - Single Row Layout */}
      <div className="flex-1 overflow-auto p-2" style={{ margin: 0 }}>
        <div className="flex flex-wrap gap-1" style={{ margin: 0 }}>
          {UML_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 whitespace-nowrap ${
                activeTemplate === template.id
                  ? 'bg-accent text-white border border-accent shadow-md'
                  : 'bg-surface border border-muted/50 text-foreground hover:bg-surface/80 hover:border-muted'
              }`}
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
