import React from 'react';
import { StateData } from './types';

interface USMapVisualizationProps {
  stateData: StateData[];
  selectedState: string | null;
  onStateSelect: (state: string | null) => void;
}

export default function USMapVisualization({ stateData, selectedState, onStateSelect }: USMapVisualizationProps) {
  const statePositions: Record<string, {x: number, y: number}> = {
    'Florida': {x: 770, y: 420},
    'Arizona': {x: 220, y: 380},
    'Utah': {x: 280, y: 320},
    'Louisiana': {x: 480, y: 420},
    'Missouri': {x: 500, y: 330},
    'Tennessee': {x: 620, y: 350},
    'West Virginia': {x: 680, y: 310},
    'Arkansas': {x: 480, y: 370},
    'Iowa': {x: 500, y: 290},
    'North Carolina': {x: 720, y: 350},
    'Ohio': {x: 630, y: 300},
    'South Carolina': {x: 730, y: 380},
    'Texas': {x: 340, y: 440},
    'Georgia': {x: 700, y: 390},
    'Alabama': {x: 650, y: 400},
    'Indiana': {x: 590, y: 300},
    'Oklahoma': {x: 420, y: 380},
    'New Hampshire': {x: 820, y: 260},
    'Montana': {x: 330, y: 270},
    'South Dakota': {x: 450, y: 280},
    'North Dakota': {x: 450, y: 250},
    'Nebraska': {x: 450, y: 320},
    'Kansas': {x: 450, y: 350},
    'Kentucky': {x: 630, y: 340},
    'Wisconsin': {x: 550, y: 270},
    'Alaska': {x: 150, y: 500},
    'Idaho': {x: 280, y: 290},
    'Wyoming': {x: 360, y: 300},
    'Mississippi': {x: 550, y: 410}
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">ESA Market Map</h2>
      <div className="relative w-full h-96 mb-6 bg-blue-50 rounded-lg border">
        <svg viewBox="0 0 1000 600" className="w-full h-full">
          {/* Clean US Map Background */}
          <defs>
            <pattern id="mapGrid" patternUnits="userSpaceOnUse" width="30" height="30">
              <rect width="30" height="30" fill="#f8fafc"/>
              <circle cx="15" cy="15" r="1" fill="#e2e8f0"/>
            </pattern>
            <filter id="dropShadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* US Continental Outline */}
          <path d="M 200 200 Q 250 180 300 200 L 400 190 Q 500 185 600 195 L 700 200 Q 800 210 850 250 L 870 300 Q 875 350 860 400 L 850 450 Q 800 480 750 470 L 700 460 Q 650 465 600 460 L 500 455 Q 400 460 350 450 L 300 440 Q 250 430 220 400 L 200 350 Q 195 300 200 250 Z" 
                fill="url(#mapGrid)" 
                stroke="#cbd5e1" 
                strokeWidth="2" 
                filter="url(#dropShadow)"/>
          
          {/* Great Lakes */}
          <ellipse cx="650" cy="250" rx="35" ry="12" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
          <ellipse cx="680" cy="265" rx="20" ry="8" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
          <ellipse cx="620" cy="275" rx="15" ry="6" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
          
          {/* ESA Program States */}
          {stateData.map((state, index) => {
            const position = statePositions[state.state] || {x: 100 + (index % 10) * 80, y: 100 + Math.floor(index / 10) * 60};
            const color = state.revenueOpportunity === 'High' ? '#10b981' : 
                         state.revenueOpportunity === 'Medium' ? '#f59e0b' : '#ef4444';
            
            return (
              <g key={state.state}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={Math.max(8, Math.min(25, Math.sqrt(state.totalRevenue / 10000000)))}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-all"
                  onClick={() => onStateSelect(selectedState === state.state ? null : state.state)}
                />
                <text
                  x={position.x}
                  y={position.y + 30}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                  className="pointer-events-none select-none"
                >
                  {state.state.length > 8 ? state.state.substring(0, 6) + '...' : state.state}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}