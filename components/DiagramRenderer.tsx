
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface DiagramRendererProps {
  code: string;
  type: string;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code, type }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.mermaid && containerRef.current) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter',
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#fff',
          primaryBorderColor: '#3b82f6',
          lineColor: '#6366f1',
          secondaryColor: '#10b981',
          tertiaryColor: '#f59e0b'
        }
      });

      const renderDiagram = async () => {
        try {
          // Clear previous
          containerRef.current!.innerHTML = `<div class="mermaid">${code}</div>`;
          await window.mermaid.run();
        } catch (err) {
          console.error("Mermaid failed to render:", err);
          containerRef.current!.innerHTML = `<div class="text-red-500 p-4 border border-red-900 bg-red-900/10 rounded">Error rendering diagram. Please check your syntax.</div>`;
        }
      };

      renderDiagram();
    }
  }, [code, type]);

  return (
    <div className="w-full h-full overflow-auto bg-[#0f0f12] rounded-xl flex items-center justify-center p-8">
      <div ref={containerRef} className="mermaid-container transition-all duration-300 transform" />
    </div>
  );
};

export default DiagramRenderer;
