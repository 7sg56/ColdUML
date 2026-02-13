'use client';

import { useState, memo } from 'react';
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

export default memo(function UMLTemplates({ onInsertTemplate }: UMLTemplatesProps) {
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
    <div className="h-full w-full flex items-center">
      {/* Horizontal scrolling templates - optimized for mobile */}
      <div className="flex gap-2 items-center w-full overflow-x-auto">
        {UML_TEMPLATES.map((template) => {
          const isActive = activeTemplate === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={`
                group relative flex-shrink-0
                px-3 py-2
                text-xs font-medium 
                rounded-lg
                transition-all duration-150
                border
                flex items-center gap-2
                whitespace-nowrap
                ${
                  isActive
                    ? 'bg-accent/10 text-accent border-accent/30 shadow-sm scale-[0.96]'
                    : 'bg-surface/60 border-border/40 text-foreground/80 hover:bg-accent/5 hover:border-accent/20 hover:text-foreground active:scale-95'
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
                    ? 'text-accent'
                    : 'text-muted-foreground group-hover:text-foreground/80'
                }
              `}>
                {template.icon}
              </div>
              
              {/* Name */}
              <span className="font-semibold">{template.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
