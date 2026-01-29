
import React, { useEffect, useRef, useState } from 'react';
import { BlueprintGraph as BlueprintGraphData, PinType } from '../types';
import BlueprintNode from './BlueprintNode';
import { PIN_COLORS } from '../constants';

interface GraphProps {
  graph: BlueprintGraphData;
}

const BlueprintGraph: React.FC<GraphProps> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Fixed: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error
  const [paths, setPaths] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const generatePaths = () => {
      // Fixed: Replaced JSX.Element with React.ReactElement
      const newPaths: React.ReactElement[] = [];

      graph.edges.forEach((edge) => {
        const fromEl = document.getElementById(`pin-${edge.fromNodeId}-${edge.fromPinId}`);
        const toEl = document.getElementById(`pin-${edge.toNodeId}-${edge.toPinId}`);

        if (fromEl && toEl && svgRef.current) {
          const svgRect = svgRef.current.getBoundingClientRect();
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          // Calculate start and end relative to SVG container
          const startX = fromRect.right - svgRect.left - 4;
          const startY = fromRect.top + fromRect.height / 2 - svgRect.top;
          const endX = toRect.left - svgRect.left + 4;
          const endY = toRect.top + toRect.height / 2 - svgRect.top;

          // Find the color based on the pin type (checking the graph data)
          const fromNode = graph.nodes.find(n => n.id === edge.fromNodeId);
          const pin = fromNode?.outputs.find(p => p.id === edge.fromPinId);
          const color = pin ? PIN_COLORS[pin.type] : '#ffffff';

          // Cubic Bezier calculation
          const ctrlX1 = startX + Math.abs(endX - startX) * 0.5;
          const ctrlX2 = endX - Math.abs(endX - startX) * 0.5;

          newPaths.push(
            <path
              key={edge.id}
              d={`M ${startX} ${startY} C ${ctrlX1} ${startY}, ${ctrlX2} ${endY}, ${endX} ${endY}`}
              stroke={color}
              strokeWidth={pin?.type === PinType.EXEC ? "2.5" : "1.5"}
              fill="none"
              className="opacity-80 shadow-glow"
              style={{ filter: `drop-shadow(0 0 2px ${color}88)` }}
            />
          );
        }
      });
      setPaths(newPaths);
    };

    // Need a small timeout to ensure DOM elements (nodes) are rendered and accessible
    const timer = setTimeout(generatePaths, 50);
    return () => clearTimeout(timer);
  }, [graph]);

  return (
    <div className="relative w-full h-full blueprint-grid overflow-auto bg-[#0b0b0b]">
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {paths}
      </svg>
      
      <div className="relative z-20 p-[2000px]">
        {graph.nodes.map((node) => (
          <BlueprintNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
};

export default BlueprintGraph;
