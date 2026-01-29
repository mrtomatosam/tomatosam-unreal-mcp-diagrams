
import React, { useState, useEffect, useRef } from 'react';
import BlueprintGraph, { GraphRef } from './components/BlueprintGraph';
import { BlueprintGraph as BlueprintGraphData } from './types';
import { generateBlueprint } from './services/geminiService';

const INITIAL_GRAPH: BlueprintGraphData = {
  nodes: [],
  edges: []
};

// Fixed: Correctly declare or augment the global AIStudio type to match the platform's expectations
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('Create a complex character ability system with cooldown and mana check.');
  const [graph, setGraph] = useState<BlueprintGraphData>(INITIAL_GRAPH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValue, setImportValue] = useState('');
  
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [needsKey, setNeedsKey] = useState(false);
  
  const lastSyncHash = useRef<string>('');
  const graphRef = useRef<GraphRef>(null);

  const checkKey = async () => {
    if (!process.env.API_KEY) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setNeedsKey(true);
        return false;
      }
    }
    setNeedsKey(false);
    return true;
  };

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setNeedsKey(false);
    // Proceed regardless of race condition as per instructions
    handleGenerate();
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    const hasKey = await checkKey();
    if (!hasKey && !process.env.API_KEY) return;

    setLoading(true);
    setError(null);
    try {
      // Create a new GoogleGenAI instance right before making an API call to ensure it uses the latest key
      const result = await generateBlueprint(prompt);
      if (result && result.nodes) {
        setGraph(result);
        setTimeout(() => graphRef.current?.centerView(), 500);
      }
    } catch (err: any) {
      if (err.message === "API_KEY_NOT_FOUND") {
        setError("API Key inválida ou não encontrada. Por favor, selecione novamente.");
        setNeedsKey(true);
      } else {
        setError(err.message || "Falha na geração. Verifique sua conexão e API Key.");
      }
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
    const interval = setInterval(pollSync, 2000);
    return () => clearInterval(interval);
  }, [isLiveSync]);

  useEffect(() => {
    const init = async () => {
      const ok = await checkKey();
      if (ok || process.env.API_KEY) {
        handleGenerate();
      }
    };
    init();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121212] text-gray-200 font-sans">
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#1a1a1a] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">U</div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm leading-tight text-white">Unreal <span className="text-blue-400">Blueprint</span></h1>
            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Gemini 3 Pro Engine</span>
          </div>
        </div>
        
        <form onSubmit={handleGenerate} className="flex-1 max-w-xl mx-8 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the blueprint logic..."
            className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg px-4 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={loading || needsKey}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap"
          >
            {loading ? 'Processing...' : 'Generate'}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => graphRef.current?.centerView()}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
            title="Recenter View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          
          <div className={`px-2 py-1 rounded border text-[9px] font-bold transition-all ${syncStatus === 'syncing' ? 'bg-blue-900 border-blue-500 text-white animate-pulse' : 'bg-black border-white/10 text-gray-500'}`}>
            MCP SYNC
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="border border-white/10 text-[10px] px-4 py-2 rounded-lg hover:bg-white/5 uppercase font-bold"
          >
            JSON
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-900/90 border border-red-500 text-white px-4 py-2 rounded-lg text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
            <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">✕</button>
          </div>
        )}

        {needsKey && (
          <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">API Key Required</h2>
                <p className="text-sm text-gray-400">
                  To generate professional blueprints with Gemini 3 Pro, you need to select a paid project API key.
                </p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs text-blue-400 hover:underline mt-2 block">
                  Learn about billing & keys
                </a>
              </div>
              <button 
                onClick={handleSelectKey}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20"
              >
                Select API Key
              </button>
            </div>
          </div>
        )}

        {(loading || syncStatus === 'syncing') && (
          <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
             <div className="flex flex-col items-center gap-4 bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl shadow-2xl">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-white font-bold uppercase tracking-widest">Generating Complex Logic</span>
                  <span className="text-[9px] text-gray-500 italic">Thinking budget: 4000 tokens...</span>
                </div>
             </div>
          </div>
        )}
        <BlueprintGraph ref={graphRef} graph={graph} />
      </main>

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowImportModal(false)}></div>
          <div className="relative w-full max-w-3xl bg-[#1a1a1a] rounded-2xl p-6 border border-white/10 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Blueprint Data (JSON)</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <textarea
              value={importValue || JSON.stringify(graph, null, 2)}
              onChange={(e) => setImportValue(e.target.value)}
              className="flex-1 h-[60vh] bg-black p-4 font-mono text-[11px] rounded-xl border border-white/5 focus:border-blue-500 outline-none text-blue-300"
            />
            <button 
              onClick={() => {
                try { 
                  const parsed = JSON.parse(importValue || JSON.stringify(graph));
                  setGraph(parsed); 
                  setShowImportModal(false); 
                  setTimeout(() => graphRef.current?.centerView(), 200);
                } catch(e) { alert("Invalid JSON Structure"); }
              }}
              className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold uppercase text-xs transition-all"
            >
              Apply Blueprint
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
