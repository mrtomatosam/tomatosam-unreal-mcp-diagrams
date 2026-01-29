
import React, { useEffect, useRef, useState } from 'react';
import { BlueprintGraph as BlueprintGraphData, PinType } from '../types';
import BlueprintNode from './BlueprintNode';
import { PIN_COLORS } from '../constants';

interface GraphProps {
  graph: BlueprintGraphData;
}

const BlueprintGraph: React.FC<GraphProps> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    // Garante que o gráfico tenha a estrutura básica antes de tentar desenhar caminhos
    if (!graph || !graph.nodes || !graph.edges) return;

    const generatePaths = () => {
      const newPaths: React.ReactElement[] = [];

      graph.edges.forEach((edge) => {
        if (!edge.fromNodeId || !edge.toNodeId) return;

        const fromEl = document.getElementById(`pin-${edge.fromNodeId}-${edge.fromPinId}`);
        const toEl = document.getElementById(`pin-${edge.toNodeId}-${edge.toPinId}`);

        if (fromEl && toEl && svgRef.current) {
          const svgRect = svgRef.current.getBoundingClientRect();
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          const startX = fromRect.right - svgRect.left - 4;
          const startY = fromRect.top + fromRect.height / 2 - svgRect.top;
          const endX = toRect.left - svgRect.left + 4;
          const endY = toRect.top + toRect.height / 2 - svgRect.top;

          const fromNode = graph.nodes.find(n => n.id === edge.fromNodeId);
          const pin = fromNode?.outputs?.find(p => p.id === edge.fromPinId);
          const color = pin ? PIN_COLORS[pin.type] : '#ffffff';

          const ctrlX1 = startX + Math.abs(endX - startX) * 0.5;
          const ctrlX2 = endX - Math.abs(endX - startX) * 0.5;

          newPaths.push(
            <path
              key={edge.id || `${edge.fromNodeId}-${edge.toNodeId}`}
              d={`M ${startX} ${startY} C ${ctrlX1} ${startY}, ${ctrlX2} ${endY}, ${endX} ${endY}`}
              stroke={color}
              strokeWidth={pin?.type === PinType.EXEC ? "2.5" : "1.5"}
              fill="none"
              className="opacity-80 transition-all duration-300"
              style={{ filter: `drop-shadow(0 0 2px ${color}88)` }}
            />
          );
        }
      });
      setPaths(newPaths);
    };

    const timer = setTimeout(generatePaths, 100);
    return () => clearTimeout(timer);
  }, [graph]);

  // Se o gráfico estiver vazio ou malformado, renderiza apenas o grid
  const nodes = graph?.nodes || [];

  return (
    <div className="relative w-full h-full blueprint-grid overflow-auto bg-[#0b0b0b]">
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      >
        {paths}
      </svg>
      
      <div className="relative z-20 p-[2000px]">
        {nodes.map((node) => (
          node && node.id ? <BlueprintNode key={node.id} node={node} /> : null
        ))}
      </div>
    </div>
  );
};

export default BlueprintGraph;
