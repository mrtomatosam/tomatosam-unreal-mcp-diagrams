
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
  const [isReady, setIsReady] = useState(false);

  // ID único para esta instância do diagrama
  const [diagramId] = useState(`mermaid-svg-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter',
        class: { useMaxWidth: false },
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
          padding: 15,
          useMaxWidth: false
        }
      });
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const render = async () => {
      try {
        setError(null);
        const element = containerRef.current;
        if (!element) return;

        // Limpa e prepara o estado do Mermaid para este ID
        element.removeAttribute('data-processed');
        element.innerHTML = code;

        // Aguarda fontes e um frame para garantir que o layout CSS inicial foi aplicado
        await document.fonts.ready;

        setTimeout(async () => {
          if (!containerRef.current) return;
          
          try {
            const { svg } = await window.mermaid.render(diagramId, code);
            if (containerRef.current) {
              containerRef.current.innerHTML = svg;
              
              // Pós-processamento para garantir visibilidade
              const svgElement = containerRef.current.querySelector('svg');
              if (svgElement) {
                svgElement.style.maxWidth = 'none';
                svgElement.style.height = 'auto';
                svgElement.style.overflow = 'visible';
                
                const texts = svgElement.querySelectorAll('text');
                texts.forEach((t: any) => {
                  t.style.fontFamily = "'Inter', sans-serif";
                  t.style.fontSize = "10px";
                });
              }
            }
          } catch (mermaidError: any) {
            console.warn("Mermaid Render Warning:", mermaidError);
            // O erro de getBoundingClientRect às vezes é falso positivo durante o render
            if (!mermaidError.message?.includes('getBoundingClientRect')) {
              setError("Sintaxe do diagrama inválida.");
            }
          }
        }, 100);
      } catch (err) {
        console.error("Render Setup Error:", err);
        setError("Erro ao preparar o renderizador.");
      }
    };

    render();
  }, [code, isReady, diagramId]);

  return (
    <div className="w-full h-full overflow-auto bg-[#0f0f12] rounded-xl relative group scroll-smooth">
      <div className="p-8 min-w-max min-h-max flex justify-center items-start">
        <div 
          ref={containerRef} 
          id={diagramId + "-container"}
          className="mermaid transition-opacity duration-300 ease-in-out"
          style={{ opacity: error ? 0 : 1 }}
        />
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#0a0a0c]/90 backdrop-blur-sm p-6">
          <div className="bg-zinc-900 border border-red-900/50 p-6 rounded-2xl max-w-sm text-center shadow-2xl">
            <h3 className="text-red-500 font-bold mb-2 text-lg">Erro de Estrutura</h3>
            <p className="text-zinc-400 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors"
            >
              Recarregar App
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => { window.location.reload(); }}
        className="fixed bottom-14 right-14 p-3 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-30 shadow-2xl"
        title="Forçar Atualização"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

export default DiagramRenderer;
