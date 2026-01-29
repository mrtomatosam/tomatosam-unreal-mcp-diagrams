
import React from 'react';
import { PinType } from './types';

export const COLORS = {
  BACKGROUND: '#121212',
  GRID_THICK: '#252525',
  GRID_THIN: '#1a1a1a',
  NODE_BG: '#202020',
  NODE_HEADER_EVENT: '#7a1c1c',
  NODE_HEADER_FUNCTION: '#1a4e8a',
  NODE_HEADER_FLOW: '#444444',
  NODE_HEADER_VAR: '#1c4a2b',
};

export const PIN_COLORS: Record<PinType, string> = {
  [PinType.EXEC]: '#ffffff',
  [PinType.BOOLEAN]: '#9b0000',
  [PinType.INTEGER]: '#1ee0b2',
  [PinType.FLOAT]: '#97ef2b',
  [PinType.STRING]: '#ff00d4',
  [PinType.VECTOR]: '#ffc107',
  [PinType.OBJECT]: '#0070f3',
  [PinType.EVENT]: '#ff3b3b',
};

export const PinIcon: React.FC<{ type: PinType; connected?: boolean }> = ({ type, connected = true }) => {
  if (type === PinType.EXEC) {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="mr-1">
        <path
          d="M2 1 L10 6 L2 11 Z"
          fill={connected ? '#ffffff' : 'transparent'}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return (
    <div
      className={`w-3 h-3 rounded-full mr-1 border-2`}
      style={{
        backgroundColor: connected ? PIN_COLORS[type] : 'transparent',
        borderColor: PIN_COLORS[type],
      }}
    />
  );
};
