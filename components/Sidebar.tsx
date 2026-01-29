
import React from 'react';
import { Diagram } from '../types';

interface SidebarProps {
  diagrams: Diagram[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ diagrams, activeId, onSelect, onNew, onDelete }) => {
  return (
    <div className="w-72 h-full bg-[#0a0a0c] border-r border-zinc-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Projects</h2>
        <button 
          onClick={onNew}
          className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {diagrams.map(diag => (
          <div 
            key={diag.id}
            onClick={() => onSelect(diag.id)}
            className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-all ${
              activeId === diag.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <div className="flex-1 truncate">
              <div className="font-medium truncate">{diag.name}</div>
              <div className={`text-[10px] ${activeId === diag.id ? 'text-blue-200' : 'text-zinc-600'}`}>
                {new Date(diag.lastModified).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(diag.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-zinc-800">
        <div className="text-[11px] text-zinc-600 text-center">
          MCP Server Connected: v2.4.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
