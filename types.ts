export type DiagramType = 'class' | 'usecase';

export interface UMLTemplate {
  id: string;
  name: string;
  type: DiagramType;
  content: string;
}

export interface DiagramData {
  type: DiagramType;
  content: string;
  svg?: string;
}