
import React from 'react';
import { BlueprintNode as BlueprintNodeData } from '../types';
import { COLORS, PinIcon } from '../constants';

interface NodeProps {
  node: BlueprintNodeData;
}

const getHeaderColor = (type: string) => {
  switch (type) {
    case 'EVENT': return COLORS.NODE_HEADER_EVENT;
    case 'FUNCTION': return COLORS.NODE_HEADER_FUNCTION;
    case 'CONTROL_FLOW': return COLORS.NODE_HEADER_FLOW;
    case 'VARIABLE': return COLORS.NODE_HEADER_VAR;
    default: return COLORS.NODE_HEADER_FLOW;
  }
};

const BlueprintNode: React.FC<NodeProps> = ({ node }) => {
  const headerColor = getHeaderColor(node.type);

  return (
    <div 
      className="absolute border border-black/50 shadow-2xl rounded overflow-hidden min-w-[180px] select-none"
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        backgroundColor: COLORS.NODE_BG,
      }}
    >
      {/* Header */}
      <div 
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: headerColor }}
      >
        <div className="flex items-center gap-2">
          {node.type === 'EVENT' && (
             <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
               <path d="M13 3l-2 3H2v15h20V3h-9zM4 19V8h16v11H4z" />
             </svg>
          )}
          <span className="text-white text-xs font-bold uppercase tracking-tight">
            {node.title}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex justify-between p-2 gap-8">
        {/* Inputs */}
        <div className="flex flex-col gap-2">
          {node.inputs.map((pin) => (
            <div key={pin.id} className="flex items-center group">
              <div id={`pin-${node.id}-${pin.id}`} className="flex items-center">
                <PinIcon type={pin.type} connected={true} />
                <span className="text-[10px] text-gray-300 font-medium">{pin.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Outputs */}
        <div className="flex flex-col gap-2 items-end">
          {node.outputs.map((pin) => (
            <div key={pin.id} className="flex items-center group">
              <div id={`pin-${node.id}-${pin.id}`} className="flex items-center">
                <span className="text-[10px] text-gray-300 font-medium">{pin.name}</span>
                <div className="ml-1">
                  <PinIcon type={pin.type} connected={true} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlueprintNode;
