
export enum DiagramType {
  CLASS = 'classDiagram',
  SEQUENCE = 'sequenceDiagram',
  STATE = 'stateDiagram',
  FLOW = 'flowchart TD'
}

export interface Diagram {
  id: string;
  name: string;
  type: DiagramType;
  code: string;
  lastModified: number;
}

export interface AnalysisResult {
  refactorSuggestions: string[];
  complexityScore: number;
  potentialIssues: string[];
}
