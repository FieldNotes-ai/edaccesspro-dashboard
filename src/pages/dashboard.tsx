import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';

interface ESAProgram {
  id: string;
  state: string;
  name: string;
  portalTechnology: string;
  annualAmount: string;
  currentMarketSize?: number;
  programStatus: string;
  currentWindowStatus: string;
}

interface StateData {
  state: string;
  programs: ESAProgram[];
  totalRevenue: number;
  studentCount: number;
  complexity: 'Low' | 'Medium' | 'High';
}

export default function ConsolidatedDashboard() {
  const [programs, setPrograms] = useState<ESAProgram[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verified enrollment data - consolidated here
  const ENROLLMENT_DATA: Record<string, number> = {
    'Florida': 429585, // FES-EO: 307,609 + FES-UA: 122,051
    'Arizona': 83704,
    'Iowa': 18000,
    'Tennessee': 2088,
    'Indiana': 862,
    'Mississippi': 345,
    'Utah': 10000,
    'Louisiana': 2000,
    'Georgia': 3000,
    'Alabama': 1000,
    'South Carolina': 5000,
    'North Carolina': 3000,
    'Wyoming': 1500,
    'Montana': 500,
    'Alaska': 300,
    'Idaho': 1200,
    'West Virginia': 8000,
    'Arkansas': 4000,
    'Missouri': 6000
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/airtable?action=programs');
      if (response.ok) {
        const data = await response.json();
        const programList = data.programs || [];
        setPrograms(programList);
        setStateData(processStateData(programList));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarketSize = (program: ESAProgram): number => {
    if (program.currentMarketSize && program.currentMarketSize > 0) {
      return program.currentMarketSize;
    }
    return ENROLLMENT_DATA[program.state] || 1000;
  };

  const processStateData = (programs: ESAProgram[]): StateData[] => {
    const stateGroups = programs.reduce((acc: Record<string, ESAProgram[]>, program) => {
      if (!acc[program.state]) acc[program.state] = [];
      acc[program.state].push(program);
      return acc;
    }, {});

    return Object.keys(stateGroups).map(state => {
      const statePrograms: ESAProgram[] = stateGroups[state];
      const studentCount = statePrograms.reduce((sum, p) => sum + getMarketSize(p), 0);
      const totalRevenue = studentCount * 8000; // Average $8K per student
      
      // Calculate complexity
      const hasClassWallet = statePrograms.some(p => p.portalTechnology === 'ClassWallet');
      const hasMultiplePrograms = statePrograms.length > 2;
      const complexity: 'Low' | 'Medium' | 'High' = 
        (hasClassWallet && hasMultiplePrograms) ? 'High' :
        (hasClassWallet || hasMultiplePrograms) ? 'Medium' : 'Low';
      
      return {
        state,
        programs: statePrograms,
        totalRevenue,
        studentCount,
        complexity
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const totalStudents = stateData.reduce((sum, s) => sum + s.studentCount, 0);
  const totalMarket = stateData.reduce((sum, s) => sum + s.totalRevenue, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ESA market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">ESA Market Intelligence Dashboard</h1>
            <p className="text-xl text-blue-100 mb-6">
              Comprehensive market analysis for educational vendors
            </p>
            <div className="flex justify-center">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {stateData.length} Jurisdictions • ${(totalMarket / 1000000000).toFixed(1)}B+ Market
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{stateData.length}</div>
            <div className="text-sm text-gray-600">Active States</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stateData.filter(s => s.complexity === 'Low').length}
            </div>
            <div className="text-sm text-gray-600">Low Complexity</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${(totalMarket / 1000000000).toFixed(1)}B
            </div>
            <div className="text-sm text-gray-600">Total Market Size</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalStudents.toLocaleString()} students
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stateData.filter(s => s.totalRevenue > 100000000).length}
            </div>
            <div className="text-sm text-gray-600">$100M+ Markets</div>
          </div>
        </div>

        {/* Professional US Map Visualization */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ESA Market Map</h2>
          <div className="relative w-full h-96 mb-6 bg-blue-50 rounded-lg border">
            <svg viewBox="0 0 1000 600" className="w-full h-full">
              {/* Professional US Continental Outline */}
              <path 
                d="M 200 200 Q 250 180 300 200 L 400 190 Q 500 185 600 195 L 700 200 Q 800 210 850 250 L 870 300 Q 875 350 860 400 L 850 450 Q 800 480 750 470 L 700 460 Q 650 465 600 460 L 500 455 Q 400 460 350 450 L 300 440 Q 250 430 220 400 L 200 350 Q 195 300 200 250 Z" 
                fill="#f8fafc" 
                stroke="#cbd5e1" 
                strokeWidth="2"
              />
              
              {/* Great Lakes */}
              <ellipse cx="650" cy="250" rx="35" ry="12" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
              <ellipse cx="680" cy="265" rx="20" ry="8" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
              <ellipse cx="620" cy="275" rx="15" ry="6" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
              
              {/* Interactive State Circles */}
              {stateData.map((state, index) => {
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
                  'South Carolina': {x: 730, y: 380},
                  'Texas': {x: 340, y: 440},
                  'Georgia': {x: 700, y: 390},
                  'Alabama': {x: 650, y: 400},
                  'Indiana': {x: 590, y: 300},
                  'Montana': {x: 330, y: 270},
                  'Alaska': {x: 150, y: 500},
                  'Idaho': {x: 280, y: 290},
                  'Wyoming': {x: 360, y: 300},
                  'Mississippi': {x: 550, y: 410}
                };
                
                const position = statePositions[state.state] || {x: 100 + (index % 10) * 80, y: 100 + Math.floor(index / 10) * 60};
                const color = state.complexity === 'Low' ? '#10b981' : 
                             state.complexity === 'Medium' ? '#f59e0b' : '#ef4444';
                const radius = Math.max(8, Math.min(25, Math.sqrt(state.totalRevenue / 10000000)));
                
                return (
                  <g key={state.state}>
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r={radius}
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setSelectedState(selectedState === state.state ? null : state.state)}
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
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Complexity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium Complexity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Complexity</span>
            </div>
          </div>
        </div>

        {/* State Details Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedState ? `${selectedState} Programs` : 'All ESA Programs'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(selectedState ? 
                  stateData.find(s => s.state === selectedState)?.programs || [] : 
                  programs
                ).map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{program.name}</div>
                      <div className="text-sm text-gray-500">{program.state}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getMarketSize(program).toLocaleString()} students
                      </div>
                      <div className="text-xs text-gray-500">
                        ${((getMarketSize(program) * 8000) / 1000000).toFixed(0)}M potential
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.annualAmount || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.portalTechnology === 'ClassWallet' ? 'bg-blue-100 text-blue-800' :
                        program.portalTechnology === 'Odyssey' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {program.portalTechnology || 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.currentWindowStatus === 'Open' ? 'bg-green-100 text-green-800' :
                        program.currentWindowStatus === 'Opening Soon' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {program.currentWindowStatus || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.headers.cookie || '';
  const authCookie = cookies.split(';').find(c => c.trim().startsWith('demo-auth='));
  
  if (!authCookie || !authCookie.includes('authenticated')) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return { props: {} };
};