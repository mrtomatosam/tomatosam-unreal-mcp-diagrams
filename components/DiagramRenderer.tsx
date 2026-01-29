
import React, { useEffect, useRef, useState } from 'react';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter',
        class: {
          useMaxWidth: false, // Desabilitar MaxWidth permite que o diagrama use o tamanho real necessário
        },
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#3b82f6',
          lineColor: '#6366f1',
          secondaryColor: '#10b981',
          tertiaryColor: '#f59e0b',
          mainBkg: '#18181b',
          nodeBorder: '#3f3f46',
          fontSize: '10px',
          labelFontSize: '10px',
        },
        classDiagram: {
          padding: 12, 
          useMaxWidth: false
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!window.mermaid || !containerRef.current) return;

    const renderDiagram = async () => {
      try {
        setError(null);
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const element = document.createElement('div');
        element.id = id;
        element.className = 'mermaid';
        element.style.opacity = '0';
        element.style.display = 'flex';
        element.style.justifyContent = 'center';
        element.style.minWidth = 'min-content'; // Permite expansão horizontal
        element.textContent = code;
        container.appendChild(element);

        await document.fonts.ready;

        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              await window.mermaid.run({
                nodes: [element],
              });
              
              const svg = element.querySelector('svg');
              if (svg) {
                // Mantemos o SVG no tamanho calculado para evitar distorção de texto
                svg.style.height = 'auto';
                svg.style.overflow = 'visible';
                
                const texts = svg.querySelectorAll('text');
                texts.forEach((t: any) => {
                  t.style.fontFamily = "'Inter', sans-serif";
                  t.style.whiteSpace = "pre";
                  t.style.fontSize = "10px";
                });
              }
              
              element.style.opacity = '1';
              element.style.transition = 'opacity 0.4s ease';
            } catch (err) {
              console.error("Internal Mermaid Error:", err);
              setError("Erro na sintaxe do diagrama.");
            }
          }, 50);
        });

      } catch (err: any) {
        console.error("Mermaid Setup Error:", err);
        setError("Falha ao renderizar.");
      }
    };

    renderDiagram();
  }, [code, type]);

  return (
    <div className="w-full h-full overflow-auto bg-[#0f0f12] rounded-xl relative group p-6 scroll-smooth">
      {/* Container que permite scroll em ambos os eixos se necessário */}
      <div 
        ref={containerRef} 
        className="mermaid-wrapper flex flex-col items-center justify-start min-h-full" 
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#0a0a0c]/95 backdrop-blur-md p-6 text-center">
          <div className="max-w-md p-8 bg-red-950/20 border border-red-900/40 rounded-3xl shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Erro de Visualização</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all"
            >
              Reiniciar
            </button>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-14 right-14 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-30">
        <button 
          onClick={() => { containerRef.current!.innerHTML = ''; window.location.reload(); }}
          className="p-3 bg-zinc-800/80 hover:bg-blue-600 rounded-full shadow-2xl border border-zinc-700 transition-colors"
          title="Recarregar Visualização"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DiagramRenderer;
