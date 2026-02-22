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

const TEMPLATE_BUTTONS = [
  { label: 'New Class', template: TEMPLATES.newClass },
  { label: 'Inheritance', template: TEMPLATES.inheritance },
  { label: 'Association', template: TEMPLATES.association },
  { label: 'Composition', template: TEMPLATES.composition },
  { label: 'Aggregation', template: TEMPLATES.aggregation },
];

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
        {TEMPLATE_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleInsert(btn.template)}
            className="w-full px-3 py-2 text-sm bg-button-background hover:bg-button-hover border border-border rounded-md text-left transition-colors text-foreground"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
