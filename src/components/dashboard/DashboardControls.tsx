import React from 'react';
import { SortOption, FilterOption } from './types';

interface DashboardControlsProps {
  filterPortal: FilterOption;
  sortBy: SortOption;
  onFilterChange: (filter: FilterOption) => void;
  onSortChange: (sort: SortOption) => void;
}

export default function DashboardControls({ 
  filterPortal, 
  sortBy, 
  onFilterChange, 
  onSortChange 
}: DashboardControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Portal</label>
          <select
            value={filterPortal}
            onChange={(e) => onFilterChange(e.target.value as FilterOption)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Portals</option>
            <option value="ClassWallet">ClassWallet</option>
            <option value="Odyssey">Odyssey</option>
            <option value="Step Up For Students">Step Up For Students</option>
            <option value="Student First">Student First</option>
            <option value="Other">Other/Manual</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="revenue">Revenue Opportunity</option>
            <option value="complexity">Entry Difficulty (Easiest First)</option>
            <option value="alphabetical">State Name</option>
          </select>
        </div>

        <div className="ml-auto">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>High Opportunity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}