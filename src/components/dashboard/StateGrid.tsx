import React from 'react';
import { StateData } from './types';
import { getStateColor } from './utils';

interface StateGridProps {
  stateData: StateData[];
  selectedState: string | null;
  onStateSelect: (state: string | null) => void;
}

export default function StateGrid({ stateData, selectedState, onStateSelect }: StateGridProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">State Opportunity Matrix</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stateData.map((state) => (
          <div
            key={state.state}
            onClick={() => onStateSelect(selectedState === state.state ? null : state.state)}
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedState === state.state 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-4 h-4 ${getStateColor(state)} rounded-full mx-auto mb-2`}></div>
              <div className="text-sm font-medium text-gray-900">{state.state}</div>
              <div className="text-xs text-gray-500">{state.programs.length} programs</div>
              <div className="text-xs text-gray-500">${(state.totalRevenue / 1000000).toFixed(0)}M market</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}