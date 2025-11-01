'use client';

import { useState } from 'react';
import { FiBox, FiActivity, FiShuffle, FiArrowRight } from 'react-icons/fi';

export interface UMLTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  code: string;
  icon?: React.ReactNode;
}

interface UMLTemplatesProps {
  onInsertTemplate: (template: string) => void;
}

// UML Diagram Templates with icons
const UML_TEMPLATES: UMLTemplate[] = [
  {
    id: 'class-diagram',
    name: 'Class Diagram',
    type: 'Class Diagram',
    description: 'Object-oriented class relationships and inheritance',
    icon: <FiBox size={12} />,
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
    icon: <FiArrowRight size={12} />,
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
    icon: <FiActivity size={12} />,
    code: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`
  },
  {
    id: 'use-case-diagram',
    name: 'Use Case Diagram',
    type: 'Use Case Diagram',
    description: 'System functionality from user perspective',
    icon: <FiShuffle size={12} />,
    code: `graph TD
    User((User)) --> Login
    User --> ViewProfile
    User --> Logout
    
    Admin((Admin)) --> ManageUsers
    Admin --> ViewReports
    
    Login --> ViewProfile
    ManageUsers --> ViewReports`
  },
];

export default function UMLTemplates({ onInsertTemplate }: UMLTemplatesProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const handleTemplateClick = (template: UMLTemplate) => {
    setActiveTemplate(template.id);
    onInsertTemplate(template.code);
    
    // Clear active state after animation
    setTimeout(() => {
      setActiveTemplate(null);
    }, 600);
  };

  return (
    <div className="h-full w-full flex items-center p-2">
      {/* Horizontal Templates */}
      <div className="flex flex-wrap gap-1.5 items-center w-full">
        {UML_TEMPLATES.map((template) => {
          const isActive = activeTemplate === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={`
                group relative
                px-2.5 py-2 
                text-xs font-medium 
                rounded
                transition-all duration-150
                border
                flex items-center gap-1.5
                whitespace-nowrap
                ${
                  isActive
                    ? 'bg-muted/50 text-foreground border-muted/40 shadow-sm scale-[0.95]'
                    : 'bg-surface/40 border-muted/20 text-foreground/70 hover:bg-surface/60 hover:border-muted/30 hover:text-foreground/85'
                }
              `}
              title={template.description}
              aria-label={`Insert ${template.name} template`}
            >
              {/* Icon */}
              <div className={`
                flex items-center justify-center
                transition-colors duration-150
                ${
                  isActive
                    ? 'text-foreground/90'
                    : 'text-muted-foreground group-hover:text-foreground/65'
                }
              `}>
                {template.icon}
              </div>
              
              {/* Name */}
              <span>{template.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
