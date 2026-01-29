
import React, { useState, useEffect } from 'react';
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

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await generateBlueprint(prompt);
      setGraph(result);
    } catch (err) {
      setError("Failed to generate blueprint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial generation
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121212] text-gray-200">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#1a1a1a] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">U</div>
          <h1 className="font-bold text-lg tracking-tight">Unreal <span className="text-gray-400 font-medium">Visualizer</span></h1>
        </div>
        
        <form onSubmit={handleGenerate} className="flex-1 max-w-2xl mx-12 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your blueprint logic..."
            className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-semibold text-xs px-6 py-2 rounded-lg transition-colors whitespace-nowrap uppercase tracking-wider"
          >
            {loading ? 'Compiling...' : 'Generate Graph'}
          </button>
        </form>

        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">Gemini 3 Pro</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Graph Viewport */}
        <div className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-900/80 border border-red-500 text-red-100 px-4 py-2 rounded shadow-xl">
              {error}
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-sm font-medium animate-pulse text-blue-400">Architecting nodes...</p>
              </div>
            </div>
          )}

          <BlueprintGraph graph={graph} />
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-50 bg-[#1a1a1a]/80 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl w-56 text-[11px]">
          <h3 className="text-white font-bold mb-3 border-b border-white/10 pb-2 uppercase tracking-widest text-[10px]">Pin Legend</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ffffff] border border-gray-400"></div> <span className="text-gray-300">Execution Flow</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#9b0000]"></div> <span className="text-gray-300">Boolean (Red)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1ee0b2]"></div> <span className="text-gray-300">Integer (Cyan)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#97ef2b]"></div> <span className="text-gray-300">Float (Lime)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ff00d4]"></div> <span className="text-gray-300">String (Pink)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0070f3]"></div> <span className="text-gray-300">Object (Blue)</span></div>
          </div>
        </div>

        {/* Sidebar Help */}
        <div className="w-64 border-l border-white/10 bg-[#1a1a1a] p-6 overflow-y-auto hidden lg:block z-40">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Try Examples</h2>
          <div className="space-y-3">
            {[
              "Character double jump logic with stamina check",
              "Inventory pickup item and add to array",
              "Enemy AI: Seek player and attack when in range",
              "Health system with damage mitigation logic",
              "Main Menu widget creation and focus"
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setPrompt(ex);
                  handleGenerate();
                }}
                className="w-full text-left text-xs bg-[#252525] hover:bg-[#333] border border-white/5 p-3 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Controls</h3>
            <ul className="text-[10px] text-gray-500 space-y-2 list-disc pl-4">
              <li>Nodes are auto-positioned by AI.</li>
              <li>Splines are calculated using cubic beziers.</li>
              <li>Pins colors follow Unreal Engine's standard color scheme.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
