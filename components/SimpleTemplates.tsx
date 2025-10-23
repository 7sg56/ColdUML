'use client';

interface TemplateProps {
  onInsert: (template: string) => void;
}

// Simple template library as defined in the design document
const TEMPLATES = {
  newClass: `class ClassName {
    +publicMethod()
    -privateField
}`,
  inheritance: 'Parent <|-- Child',
  association: 'ClassA --> ClassB',
  composition: 'ClassA *-- ClassB',
  aggregation: 'ClassA o-- ClassB'
};

export default function SimpleTemplates({ onInsert }: TemplateProps) {
  const handleInsert = (template: string) => {
    onInsert(template);
  };

  return (
    <div className="panel-container border-r border-panel-border w-64 flex-shrink-0 p-4">
      <div className="panel-header border-b-0 px-0 py-0 mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          UML Templates
        </h2>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => handleInsert(TEMPLATES.newClass)}
          className="w-full px-3 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md text-left transition-colors text-foreground"
        >
          New Class
        </button>
        
        <button
          onClick={() => handleInsert(TEMPLATES.inheritance)}
          className="w-full px-3 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md text-left transition-colors text-foreground"
        >
          Inheritance
        </button>
        
        <button
          onClick={() => handleInsert(TEMPLATES.association)}
          className="w-full px-3 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md text-left transition-colors text-foreground"
        >
          Association
        </button>
        
        <button
          onClick={() => handleInsert(TEMPLATES.composition)}
          className="w-full px-3 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md text-left transition-colors text-foreground"
        >
          Composition
        </button>
        
        <button
          onClick={() => handleInsert(TEMPLATES.aggregation)}
          className="w-full px-3 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md text-left transition-colors text-foreground"
        >
          Aggregation
        </button>
      </div>
    </div>
  );
}