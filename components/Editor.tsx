"use client";

import { useRef } from "react";
import { DiagramType, UMLTemplate } from "../types";
import DiagramTypeSelector from "./DiagramTypeSelector";

interface EditorProps {
  text: string;
  onTextChange: (text: string) => void;
  onClearEditor: () => void;
  onLoadTemplate: (template: UMLTemplate) => void;
}

const templates: UMLTemplate[] = [
  {
    id: 'class-basic',
    name: 'Basic Class',
    type: 'class',
    content: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +eat()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    Animal <|-- Dog`
  },
  {
    id: 'class-advanced',
    name: 'Advanced Class',
    type: 'class',
    content: `classDiagram
    class User {
        +String username
        +String email
        -String password
        +login()
        +logout()
        #hashPassword()
    }
    
    class Admin {
        +String[] permissions
        +manageUsers()
        +viewLogs()
    }
    
    class Database {
        -String connectionString
        +connect()
        +disconnect()
        +query(sql: String)
    }
    
    User <|-- Admin
    User --> Database : uses`
  },
  {
    id: 'usecase-basic',
    name: 'Basic Use Case',
    type: 'usecase',
    content: `graph LR
    User((User))
    Admin((Admin))
    System{{System}}
    
    Login["Login"]
    ViewProfile["View Profile"]
    ManageUsers["Manage Users"]
    GenerateReports["Generate Reports"]
    
    User --> Login
    User --> ViewProfile
    Admin --> Login
    Admin --> ManageUsers
    Admin --> GenerateReports
    
    Login --> System
    ViewProfile --> System
    ManageUsers --> System
    GenerateReports --> System`
  },
  {
    id: 'usecase-advanced',
    name: 'Advanced Use Case',
    type: 'usecase',
    content: `graph TD
    %% Actors
    Customer((Customer))
    Staff((Staff))
    Manager((Manager))
    
    %% Use Cases
    Browse["Browse Products"]
    AddCart["Add to Cart"]
    Checkout["Checkout"]
    Payment["Process Payment"]
    Inventory["Manage Inventory"]
    Reports["Generate Reports"]
    Support["Customer Support"]
    
    %% Systems
    MainSys{{E-commerce System}}
    PayGW{{Payment Gateway}}
    
    %% Customer flows
    Customer --> Browse
    Customer --> AddCart
    Customer --> Checkout
    
    %% Staff flows
    Staff --> Payment
    Staff --> Inventory
    Staff --> Support
    
    %% Manager flows
    Manager --> Reports
    Manager --> Inventory
    
    %% System integrations
    Browse --> MainSys
    AddCart --> MainSys
    Checkout --> MainSys
    Payment --> PayGW
    Inventory --> MainSys
    Reports --> MainSys
    Support --> MainSys
    
    %% Payment gateway connection
    PayGW --> MainSys`
  },
  {
    id: 'usecase-horizontal',
    name: 'Horizontal Flow',
    type: 'usecase',
    content: `graph LR
    A((Actor A))
    B["Use Case 1"]
    C["Use Case 2"]
    D{{System}}
    
    A --> B
    A --> C
    B --> D
    C --> D
    
    %% Direction: Left to Right (LR)
    %% Other options: TD (Top Down), TB (Top Bottom), RL (Right Left)`
  },
  {
    id: 'class-directions',
    name: 'Class with Directions',
    type: 'class',
    content: `classDiagram
    direction TB
    
    class Vehicle {
        +String brand
        +String model
        +startEngine()
        +stopEngine()
    }
    
    class Car {
        +int doors
        +openTrunk()
    }
    
    class Motorcycle {
        +boolean hasSidecar
        +wheelie()
    }
    
    Vehicle <|-- Car
    Vehicle <|-- Motorcycle
    
    %% Direction options: TB (Top Bottom), TD (Top Down), LR (Left Right), RL (Right Left)`
  }
];

export default function Editor({ text, onTextChange, onClearEditor, onLoadTemplate }: EditorProps) {
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const getPlaceholderText = () => {
    if (diagramType === 'class') {
      return `Create a class diagram...

Example:
classDiagram
    direction TB  %% TB, TD, LR, RL
    
    class Animal {
        +String name
        +makeSound()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    Animal <|-- Dog`;
    } else {
      return `Create a use case diagram...

Example:
graph LR  %% LR, TD, TB, RL
    User((User))
    Admin((Admin))
    System{{System}}
    
    Login["Login"]
    ManageUsers["Manage Users"]
    
    User --> Login
    Admin --> ManageUsers
    
    Login --> System
    ManageUsers --> System`;
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="editor-title">Editor</span>
        </div>
        <div className="panel-actions">
          <DiagramTypeSelector
            currentType={diagramType}
            onTypeChange={onDiagramTypeChange}
          />
          <button 
            className="icon-btn" 
            title="Clear editor" 
            onClick={onClearEditor}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="panel-body">
        <div className="templates-container">
          {currentTypeTemplates.map((template) => (
            <button
              key={template.id}
              className="template-btn"
              onClick={() => onLoadTemplate(template)}
              title={`Load ${template.name} template`}
            >
              {template.name}
            </button>
          ))}
        </div>
        
        <div className="editor-wrap">
          <div className="editor-gutter" ref={gutterRef}>
            {Array.from({ length: Math.max(1, text.split("\\n").length) }, (_, i) => (
              <div key={i} className="gutter-line">{i + 1}</div>
            ))}
          </div>
          <textarea
            id="editor"
            placeholder={getPlaceholderText()}
            value={text}
            onChange={(e) => onTextChange(e.currentTarget.value)}
            onScroll={(e) => {
              if (gutterRef.current) {
                gutterRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}