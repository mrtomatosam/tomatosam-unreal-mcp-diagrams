
import React, { useState, useEffect } from 'react';
import { Diagram, DiagramType, AnalysisResult } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import Sidebar from './components/Sidebar.tsx';
import DiagramRenderer from './components/DiagramRenderer.tsx';

const INITIAL_DIAGRAM_CODE = `classDiagram
    class AActor {
        +GetWorld()
    }
    class AGameCharacter {
        +UCharacterMovementComponent* Movement
        +float Health
        +TakeDamage(Damage)
        +Move(Input)
    }
    class APlayerCharacter {
        +UCameraComponent* Camera
        +Inventory Inventory
    }
    AActor <|-- AGameCharacter
    AGameCharacter <|-- APlayerCharacter`;

const App: React.FC = () => {
  const [diagrams, setDiagrams] = useState<Diagram[]>(() => {
    try {
      const saved = localStorage.getItem('unreal-diagrams');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load diagrams from storage", e);
    }
    return [{
      id: 'default',
      name: 'Game Hierarchy',
      type: DiagramType.CLASS,
      code: INITIAL_DIAGRAM_CODE,
      lastModified: Date.now()
    }];
  });
  
  const [activeId, setActiveId] = useState('default');
  const [sourceCode, setSourceCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('unreal-diagrams', JSON.stringify(diagrams));
  }, [diagrams]);

  const activeDiagram = diagrams.find(d => d.id === activeId) || diagrams[0];

  const updateActiveDiagramCode = (newCode: string) => {
    setDiagrams(prev => prev.map(d => 
      d.id === activeId ? { ...d, code: newCode, lastModified: Date.now() } : d
    ));
  };

  const handleGenerate = async () => {
    if (!sourceCode.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const newDiagramCode = await geminiService.generateDiagramFromCode(sourceCode);
      if (newDiagramCode) {
        updateActiveDiagramCode(newDiagramCode);
        setShowEditor(false);
      }
    } catch (err) {
      setError("Falha ao gerar diagrama. Verifique sua conexão ou API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await geminiService.analyzeArchitecture(activeDiagram.code);
      setAnalysis(result);
    } catch (err) {
      setError("Erro ao analisar arquitetura.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createNewDiagram = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newDiag: Diagram = {
      id: newId,
      name: 'Novo Diagrama',
      type: DiagramType.CLASS,
      code: INITIAL_DIAGRAM_CODE,
      lastModified: Date.now()
    };
    setDiagrams([...diagrams, newDiag]);
    setActiveId(newId);
    setAnalysis(null);
  };

  const deleteDiagram = (id: string) => {
    if (diagrams.length <= 1) return;
    const next = diagrams.filter(d => d.id !== id);
    setDiagrams(next);
    if (activeId === id) setActiveId(next[0].id);
  };

  if (!activeDiagram) {
    return <div className="h-screen w-full bg-[#0a0a0c] flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] text-zinc-200 overflow-hidden font-sans">
      <Sidebar 
        diagrams={diagrams} 
        activeId={activeId} 
        onSelect={setActiveId} 
        onNew={createNewDiagram}
        onDelete={deleteDiagram}
      />

      <main className="flex-1 flex flex-col relative h-full">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-2 rounded-full shadow-2xl animate-bounce">
            {error}
            <button onClick={() => setError(null)} className="ml-4 font-bold">&times;</button>
          </div>
        )}

        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#0a0a0c]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-900/40">U</div>
            <input 
              value={activeDiagram.name}
              onChange={(e) => setDiagrams(prev => prev.map(d => d.id === activeId ? { ...d, name: e.target.value } : d))}
              className="bg-transparent border-none focus:ring-0 text-xl font-bold text-zinc-100 w-64 hover:bg-zinc-800/50 rounded transition-colors px-2"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowEditor(!showEditor)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showEditor ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'}`}
            >
              {showEditor ? 'Fechar Editor' : 'Gerar do Código'}
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              {isAnalyzing ? 'Analisando...' : 'Revisão do Arquiteto'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          <div className={`flex-1 transition-all duration-500 ease-in-out flex flex-col ${showEditor ? 'opacity-40 blur-sm scale-95 pointer-events-none' : 'opacity-100'}`}>
            <DiagramRenderer code={activeDiagram.code} type={activeDiagram.type} />
          </div>

          {showEditor && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-12 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-[#0f0f12] border border-zinc-800 rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100">Engenharia Reversa Unreal</h3>
                  <button onClick={() => setShowEditor(false)} className="text-zinc-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} /></svg>
                  </button>
                </div>
                <div className="p-6 flex flex-col space-y-4">
                  <label className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Cole sua classe C++ ou cabeçalho:</label>
                  <textarea 
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    placeholder="class AMyActor : public AActor { ..."
                    className="h-64 bg-[#0a0a0c] border border-zinc-800 rounded-xl p-4 font-mono text-sm text-blue-400 focus:ring-2 focus:ring-blue-600 outline-none resize-none shadow-inner"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3"
                  >
                    {isGenerating ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                    {isGenerating ? 'Processando Código...' : 'Reconstruir Hierarquia'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {analysis && !showEditor && (
            <div className="w-96 bg-[#0f0f12] border border-zinc-800 rounded-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 shadow-2xl flex flex-col border-l-blue-900/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-tighter">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Relatório Técnico
                </h3>
                <button onClick={() => setAnalysis(null)} className="text-zinc-600 hover:text-white">&times;</button>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-500 mb-3">
                    <span>Complexidade Estrutural</span>
                    <span className="text-blue-400 font-bold">{analysis.complexityScore}/10</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${analysis.complexityScore > 7 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${analysis.complexityScore * 10}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sugestões do Arquiteto</h4>
                  {analysis.refactorSuggestions.map((s: string, i: number) => (
                    <div key={i} className="text-sm text-zinc-300 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                      {s}
                    </div>
                  ))}
                </div>

                {analysis.potentialIssues.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-red-900/80 uppercase tracking-widest">Gargalos Potenciais</h4>
                    {analysis.potentialIssues.map((s: string, i: number) => (
                      <div key={i} className="text-sm text-red-200 bg-red-900/5 p-4 rounded-xl border border-red-900/20">
                        • {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <footer className="h-10 border-t border-zinc-800 bg-[#0a0a0c] px-8 flex items-center justify-between text-[10px] font-mono text-zinc-600 shrink-0">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              STATUS: ONLINE
            </span>
            <span>ENGINE: UNREAL V5.5 READY</span>
            <span>MODEL: GEMINI-3-PRO-EXPERIMENTAL</span>
          </div>
          <div className="flex items-center space-x-4 opacity-50 hover:opacity-100 transition-opacity">
            <span className="cursor-pointer hover:text-blue-400">DOCS</span>
            <span className="cursor-pointer hover:text-blue-400">GITHUB</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
