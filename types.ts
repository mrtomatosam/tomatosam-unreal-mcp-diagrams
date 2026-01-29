
export enum PinType {
  EXEC = 'EXEC',
  BOOLEAN = 'BOOLEAN',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  STRING = 'STRING',
  VECTOR = 'VECTOR',
  OBJECT = 'OBJECT',
  EVENT = 'EVENT'
}

export interface BlueprintPin {
  id: string;
  name: string;
  type: PinType;
}

export interface BlueprintNode {
  id: string;
  title: string;
  type: 'EVENT' | 'FUNCTION' | 'VARIABLE' | 'CONTROL_FLOW';
  inputs: BlueprintPin[];
  outputs: BlueprintPin[];
  position: { x: number; y: number };
}

export interface BlueprintEdge {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
}

export interface BlueprintGraph {
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
}
