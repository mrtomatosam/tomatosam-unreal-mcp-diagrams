
import React, { useState, useEffect, useCallback } from 'react';
import { Diagram, DiagramType, AnalysisResult } from './types';
import { geminiService } from './services/geminiService';
import Sidebar from './components/Sidebar';
import DiagramRenderer from './components/DiagramRenderer';

const INITIAL_DIAGRAM_CODE = `classDiagram
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
    class AEnemyCharacter {
        +UBehaviorTree* AIBehavior
    }
    AGameCharacter <|-- APlayerCharacter
    AGameCharacter <|-- AEnemyCharacter`;

const App: React.FC = () => {
  const [diagrams, setDiagrams] = useState<Diagram[]>(() => {
    const saved = localStorage.getItem('unreal-diagrams');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'default',
      name: 'Base Hierarchy',
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
    try {
      const newDiagramCode = await geminiService.generateDiagramFromCode(sourceCode);
      updateActiveDiagramCode(newDiagramCode);
      setShowEditor(false);
    } catch (err) {
      alert("Generation failed. Check API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await geminiService.analyzeArchitecture(activeDiagram.code);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createNewDiagram = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newDiag: Diagram = {
      id: newId,
      name: 'New Diagram ' + (diagrams.length + 1),
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
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#0a0a0c]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-white italic">U</div>
            <input 
              value={activeDiagram.name}
              onChange={(e) => setDiagrams(prev => prev.map(d => d.id === activeId ? { ...d, name: e.target.value } : d))}
              className="bg-transparent border-none focus:ring-0 text-lg font-semibold text-zinc-100 w-64"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowEditor(!showEditor)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              {showEditor ? 'Hide Code' : 'Generate from Code'}
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Architecture'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          {/* Main Visualizer */}
          <div className={`flex-1 transition-all duration-500 ease-in-out flex flex-col ${showEditor ? 'w-1/2' : 'w-full'}`}>
            <DiagramRenderer code={activeDiagram.code} type={activeDiagram.type} />
          </div>

          {/* AI Generator Panel */}
          {showEditor && (
            <div className="w-[450px] bg-[#0f0f12] border border-zinc-800 rounded-xl flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Source Analysis</span>
                <button onClick={() => setShowEditor(false)} className="text-zinc-600 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-zinc-500 mb-2 font-mono">Input Unreal C++ / Header / Blueprint Spec:</label>
                  <textarea 
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    placeholder="class AMyCharacter : public ACharacter { ..."
                    className="flex-1 bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 font-mono text-sm text-blue-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /><span>Generating...</span></>
                  ) : (
                    <><span>Reconstruct Hierarchy</span></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Analysis Sidebar (Floating right) */}
          {analysis && !showEditor && (
            <div className="w-80 bg-[#0f0f12] border border-zinc-800 rounded-xl p-6 overflow-y-auto animate-in fade-in duration-500 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-zinc-100 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 15.657l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM16.464 13.536l-.707-.707a1 1 0 10-1.414 1.414l.707.707a1 1 0 001.414-1.414z" /></svg>
                  Architect Review
                </h3>
                <button onClick={() => setAnalysis(null)} className="text-zinc-600 hover:text-white">&times;</button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
                    <span>Complexity</span>
                    <span>{analysis.complexityScore}/10</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${analysis.complexityScore * 10}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Suggestions</h4>
                  <ul className="space-y-3">
                    {analysis.refactorSuggestions.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-lg border-l-2 border-blue-600">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Issues</h4>
                  <ul className="space-y-3">
                    {analysis.potentialIssues.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 bg-red-900/10 p-3 rounded-lg border-l-2 border-red-600">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Toolbar (Sticky Bottom) */}
        <div className="h-12 border-t border-zinc-800 bg-[#0a0a0c] px-8 flex items-center justify-between text-[11px] font-mono text-zinc-600 shrink-0">
          <div className="flex space-x-6">
            <span>SYNC: OK</span>
            <span>MODEL: GEMINI-3-PRO</span>
            <span>NODES: {activeDiagram.code.split('\n').length}</span>
          </div>
          <div className="flex space-x-4">
            <span className="text-blue-500/80 cursor-pointer hover:text-blue-400">Export SVG</span>
            <span className="text-blue-500/80 cursor-pointer hover:text-blue-400">Download .mermaid</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
