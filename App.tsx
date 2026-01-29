
import React, { useState, useEffect, useRef } from 'react';
import BlueprintGraph, { GraphRef } from './components/BlueprintGraph';
import { BlueprintGraph as BlueprintGraphData } from './types';
import { generateBlueprint } from './services/geminiService';

const INITIAL_GRAPH: BlueprintGraphData = {
  nodes: [],
  edges: []
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('Create a complex character ability system with cooldown and mana check.');
  const [graph, setGraph] = useState<BlueprintGraphData>(INITIAL_GRAPH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValue, setImportValue] = useState('');
  
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const lastSyncHash = useRef<string>('');
  const graphRef = useRef<GraphRef>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateBlueprint(prompt);
      if (result && result.nodes) {
        setGraph(result);
        setTimeout(() => graphRef.current?.centerView(), 500);
      }
    } catch (err) {
      setError("Falha na geração. Verifique a API Key.");
    } finally {
      setLoading(false);
    }
  };

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
              setTimeout(() => {
                setSyncStatus('idle');
                graphRef.current?.centerView();
              }, 1000);
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

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121212] text-gray-200 font-sans">
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#1a1a1a] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">U</div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm">Unreal <span className="text-gray-400">Pro</span></h1>
            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Powered by Gemini 3 Pro</span>
          </div>
        </div>
        
        <form onSubmit={handleGenerate} className="flex-1 max-w-xl mx-8 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg px-4 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"
          >
            {loading ? 'Thinking...' : 'Generate'}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => graphRef.current?.centerView()}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400"
            title="Focus Graph"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          
          <div className={`px-2 py-1 rounded border text-[9px] font-bold ${syncStatus === 'syncing' ? 'bg-blue-900 border-blue-500' : 'bg-black border-white/10'}`}>
            SYNC: {syncStatus.toUpperCase()}
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="border border-white/10 text-[10px] px-4 py-2 rounded-lg hover:bg-white/5 uppercase"
          >
            JSON
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        {(loading || syncStatus === 'syncing') && (
          <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
             <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Gemini 3 Pro Processing...</span>
             </div>
          </div>
        )}
        <BlueprintGraph ref={graphRef} graph={graph} />
      </main>

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowImportModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-2xl p-6 border border-white/10 flex flex-col gap-4">
            <textarea
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              className="flex-1 h-96 bg-black p-4 font-mono text-xs rounded-xl"
            />
            <button 
              onClick={() => {
                try { setGraph(JSON.parse(importValue)); setShowImportModal(false); } catch(e) { alert("Invalid JSON"); }
              }}
              className="bg-blue-600 p-3 rounded-xl font-bold uppercase text-xs"
            >
              Apply JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
