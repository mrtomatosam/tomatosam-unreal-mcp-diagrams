
import React, { useState, useEffect, useRef } from 'react';
import BlueprintGraph from './components/BlueprintGraph';
import { BlueprintGraph as BlueprintGraphData } from './types';
import { generateBlueprint } from './services/geminiService';

const INITIAL_GRAPH: BlueprintGraphData = {
  nodes: [],
  edges: []
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('Create a simple system where pressing the "F" key toggles a light on and off.');
  const [graph, setGraph] = useState<BlueprintGraphData>(INITIAL_GRAPH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValue, setImportValue] = useState('');
  
  // Live Sync State
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const lastSyncHash = useRef<string>('');

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateBlueprint(prompt);
      if (result && result.nodes) {
        setGraph(result);
      } else {
        throw new Error("Invalid format from AI");
      }
    } catch (err) {
      console.error(err);
      setError("Falha na geração. Verifique sua API Key ou use o 'Paste JSON'.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGraph(INITIAL_GRAPH);
    lastSyncHash.current = '';
    setError(null);
  };

  const handleImportJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.nodes)) {
        setGraph({
          nodes: parsed.nodes,
          edges: parsed.edges || []
        } as BlueprintGraphData);
        setShowImportModal(false);
        setImportValue('');
        setError(null);
        return true;
      }
    } catch (e) {
      console.error("Import error", e);
    }
    return false;
  };

  // Live Sync Polling
  useEffect(() => {
    if (!isLiveSync) return;

    const pollSync = async () => {
      try {
        const response = await fetch('/api/sync');
        if (response.ok) {
          const data = await response.json();
          if (data && data.nodes) {
            const hash = JSON.stringify(data);
            if (hash !== lastSyncHash.current) {
              lastSyncHash.current = hash;
              setGraph(data);
              setSyncStatus('syncing');
              setTimeout(() => setSyncStatus('idle'), 1500);
            }
          }
        }
      } catch (e) {
        setSyncStatus('error');
      }
    };

    const interval = setInterval(pollSync, 1000);
    return () => clearInterval(interval);
  }, [isLiveSync]);

  // Initial generation
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121212] text-gray-200 font-sans">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#1a1a1a] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">U</div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm leading-tight tracking-tight">Unreal <span className="text-gray-400 font-medium">Visualizer</span></h1>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Scripting Engine</span>
          </div>
        </div>
        
        <form onSubmit={handleGenerate} className="flex-1 max-w-xl mx-8 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe logic for Gemini..."
            className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg px-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold text-[10px] px-4 py-2 rounded-lg transition-colors whitespace-nowrap uppercase tracking-wider"
          >
            {loading ? 'Processing...' : 'Generate'}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5">
             <div className="flex flex-col">
                <span className="text-[8px] text-gray-500 uppercase font-black leading-none">Live Sync</span>
                <span className={`text-[9px] font-bold ${syncStatus === 'error' ? 'text-red-500' : 'text-blue-400'}`}>
                   {syncStatus === 'syncing' ? 'UPDATING...' : isLiveSync ? 'ACTIVE' : 'OFF'}
                </span>
             </div>
             <button 
               onClick={() => setIsLiveSync(!isLiveSync)}
               className={`w-8 h-4 rounded-full relative transition-colors ${isLiveSync ? 'bg-blue-600' : 'bg-gray-700'}`}
             >
               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isLiveSync ? 'left-4.5' : 'left-0.5'}`}></div>
             </button>
          </div>

          <button
            onClick={handleReset}
            className="text-gray-500 hover:text-white transition-colors"
            title="Clear Graph"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-[10px] px-4 py-2 rounded-lg transition-colors uppercase tracking-wider"
          >
            Paste JSON
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Graph Viewport */}
        <div className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-orange-900/90 backdrop-blur border border-orange-500/50 text-orange-100 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-3">
              <span className="text-xs">{error}</span>
              <button onClick={() => setError(null)} className="text-orange-300 hover:text-white">✕</button>
            </div>
          )}
          
          {(loading || syncStatus === 'syncing') && (
            <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 animate-pulse">
                    {syncStatus === 'syncing' ? 'Receiving MCP Data' : 'Compiling Graph'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <BlueprintGraph graph={graph} />
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-50 bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl w-64">
          <h3 className="text-white font-bold mb-4 border-b border-white/10 pb-2 uppercase tracking-[0.15em] text-[9px]">Blueprint Schema</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-gray-400">Execution</span>
               <div className="w-3 h-3 rounded-sm bg-white border border-gray-400"></div>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-gray-400">Boolean</span>
               <div className="w-3 h-3 rounded-full bg-[#9b0000]"></div>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-gray-400">Integer</span>
               <div className="w-3 h-3 rounded-full bg-[#1ee0b2]"></div>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-gray-400">Float</span>
               <div className="w-3 h-3 rounded-full bg-[#97ef2b]"></div>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-gray-400">Object</span>
               <div className="w-3 h-3 rounded-full bg-[#0070f3]"></div>
            </div>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="w-72 border-l border-white/10 bg-[#1a1a1a] p-6 overflow-y-auto hidden xl:block z-40">
          <div className="mb-8">
            <h2 className="text-[10px] font-black text-white mb-4 uppercase tracking-[0.2em]">Claude Connection</h2>
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl mb-4">
               <p className="text-[11px] text-blue-300 leading-relaxed">
                 <span className="font-bold">Live Sync</span> is active. When you use the MCP tool in Claude, the graph will update here automatically.
               </p>
            </div>
          </div>

          <h2 className="text-[10px] font-black text-white mb-4 uppercase tracking-[0.2em]">Sample Logic</h2>
          <div className="space-y-2">
            {[
              "Character double jump with stamina",
              "Inventory pickup item system",
              "Enemy AI: Chase & Attack",
              "Health & Damage mitigation",
              "Main Menu UI setup"
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setPrompt(ex);
                  handleGenerate();
                }}
                className="w-full text-left text-[11px] bg-[#222] hover:bg-[#2a2a2a] border border-white/5 p-3 rounded-xl transition-all text-gray-400 hover:text-white hover:border-white/20"
              >
                {ex}
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">Rendering Info</h3>
            <ul className="text-[10px] text-gray-500 space-y-3">
              <li className="flex gap-2"><span className="text-blue-500">•</span> Auto-layout based on AI coordinate system</li>
              <li className="flex gap-2"><span className="text-blue-500">•</span> Bezier splines handle connections</li>
              <li className="flex gap-2"><span className="text-blue-500">•</span> Nodes use standard UE color headers</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#222]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Paste Blueprint JSON</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <textarea
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                placeholder='{ "nodes": [...], "edges": [...] }'
                className="flex-1 w-full bg-[#0b0b0b] border border-white/10 rounded-xl p-4 text-xs font-mono text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-[#222]">
              <button
                onClick={() => {
                  if (handleImportJson(importValue)) {
                    setShowImportModal(false);
                  } else {
                    alert("Invalid JSON format or schema.");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2 rounded-lg transition-colors uppercase tracking-wider"
              >
                Render Graph
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
