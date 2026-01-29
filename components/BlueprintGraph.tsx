
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { BlueprintGraph as BlueprintGraphData, PinType } from '../types';
import BlueprintNode from './BlueprintNode';
import { PIN_COLORS } from '../constants';

interface GraphProps {
  graph: BlueprintGraphData;
}

export interface GraphRef {
  centerView: () => void;
}

const BlueprintGraph = forwardRef<GraphRef, GraphProps>(({ graph }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<React.ReactElement[]>([]);

  useImperativeHandle(ref, () => ({
    centerView: () => {
      if (!graph.nodes.length || !containerRef.current) return;
      
      const minX = Math.min(...graph.nodes.map(n => n.position.x));
      const minY = Math.min(...graph.nodes.map(n => n.position.y));
      
      containerRef.current.scrollTo({
        left: minX + 1800, // Ajuste para o padding de 2000px
        top: minY + 1800,
        behavior: 'smooth'
      });
    }
  }));

  useEffect(() => {
    if (!graph || !graph.nodes || !graph.edges) return;

    const generatePaths = () => {
      const newPaths: React.ReactElement[] = [];

      graph.edges.forEach((edge) => {
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
              key={edge.id}
              d={`M ${startX} ${startY} C ${ctrlX1} ${startY}, ${ctrlX2} ${endY}, ${endX} ${endY}`}
              stroke={color}
              strokeWidth={pin?.type === PinType.EXEC ? "2.5" : "1.5"}
              fill="none"
              className="opacity-80"
              style={{ filter: `drop-shadow(0 0 2px ${color}66)` }}
            />
          );
        }
      });
      setPaths(newPaths);
    };

    const timer = setTimeout(generatePaths, 200);
    return () => clearTimeout(timer);
  }, [graph]);

  return (
    <div ref={containerRef} className="relative w-full h-full blueprint-grid overflow-auto bg-[#0b0b0b]">
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ width: '5000px', height: '5000px' }}
      >
        {paths}
      </svg>
      
      <div className="relative z-20 p-[2000px] w-[5000px] h-[5000px]">
        {(graph?.nodes || []).map((node) => (
          node && node.id ? <BlueprintNode key={node.id} node={node} /> : null
        ))}
      </div>
    </div>
  );
});

export default BlueprintGraph;
