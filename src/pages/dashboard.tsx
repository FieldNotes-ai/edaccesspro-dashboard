import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';

interface ESAProgram {
  id: string;
  state: string;
  name: string;
  portalTechnology: string;
  annualAmount: string;
  vendorPaymentMethod: string;
  programStatus: string;
  currentWindowStatus: string;
  allowedVendorTypes?: string[];
  complexityScore?: number;
  revenueOpportunity?: 'High' | 'Medium' | 'Low';
  priceParity?: boolean;
}

interface StateData {
  state: string;
  programs: ESAProgram[];
  totalRevenue: number;
  dominantPortal: string;
  complexityScore: number;
  revenueOpportunity: 'High' | 'Medium' | 'Low';
  vendorCount: number;
}

export default function InteractiveMapDashboard() {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [filterPortal, setFilterPortal] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'revenue' | 'complexity' | 'alphabetical'>('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchESAData();
  }, []);

  const fetchESAData = async () => {
    try {
      const response = await fetch('/api/airtable?action=programs');
      if (response.ok) {
        const data = await response.json();
        const processedData = processStateData(data.programs || []);
        setStateData(processedData);
      }
    } catch (error) {
      console.error('Failed to load ESA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processStateData = (programs: any[]): StateData[] => {
    const stateGroups = programs.reduce((acc, program) => {
      const state = program.state;
      if (!acc[state]) acc[state] = [];
      acc[state].push({
        ...program,
        complexityScore: calculateComplexityScore(program),
        revenueOpportunity: calculateRevenueOpportunity(program)
      });
      return acc;
    }, {} as Record<string, ESAProgram[]>);

    return Object.keys(stateGroups).map((state) => {
      const programs = stateGroups[state];
      return {
        state,
        programs,
        totalRevenue: calculateStateRevenue(programs),
        dominantPortal: getDominantPortal(programs),
        complexityScore: calculateAvgComplexity(programs),
        revenueOpportunity: calculateStateOpportunity(programs),
        vendorCount: programs.length,
      };
    });
  };

  const calculateComplexityScore = (program: any): number => {
    let score = 0;
    
    // Background check requirement
    if (program.backgroundCheckRequired) score += 15;
    
    // Insurance requirements
    if (program.insuranceRequired) {
      score += 10;
      if (program.insuranceMinimum > 100000) score += 5;
    }
    
    // Renewal requirements
    if (program.renewalRequired) {
      if (program.renewalFrequency === 'Annual') score += 5;
      else if (program.renewalFrequency === 'Biennial') score += 3;
      else score += 8;
    }
    
    // Portal technology complexity and fees
    if (program.portalTechnology === 'ClassWallet') score += 30; // 2.5% platform fees
    else if (program.portalTechnology === 'Student First') score += 35; // operational issues
    else if (program.portalTechnology === 'Step Up For Students') score += 25; // complex approval process
    else if (program.portalTechnology === 'Odyssey') score += 15; // moderate complexity
    else score += 10; // manual/other systems
    
    // Price parity requirements
    if (program.priceParity) score += 15;
    
    // Document requirements
    if (program.requiredDocuments && program.requiredDocuments.length > 2) {
      score += program.requiredDocuments.length * 2;
    }
    
    // Submission method complexity
    if (program.submissionMethod === 'Manual Review') score += 10;
    else if (program.submissionMethod === 'Email') score += 5;
    
    return Math.min(score, 100);
  };

  const calculateRevenueOpportunity = (program: any): 'High' | 'Medium' | 'Low' => {
    const totalMarketValue = calculateTotalMarketValue(program);
    if (totalMarketValue > 200000000) return 'High'; // $200M+ total market
    if (totalMarketValue > 50000000) return 'Medium'; // $50M+ total market
    return 'Low';
  };

  const parseAmount = (amountStr: string): number => {
    if (!amountStr) return 0;
    // Handle complex amount strings like "$7,626 standard<br>• $15,253 for students with disabilities"
    const amounts = amountStr.match(/\$?(\d{1,3}(?:,\d{3})*)/g);
    if (amounts && amounts.length > 0) {
      // Return the highest amount found
      const numericAmounts = amounts.map(amt => parseInt(amt.replace(/[$,]/g, '')));
      return Math.max(...numericAmounts);
    }
    return 0;
  };

  const extractMarketSize = (program: any): number => {
    // First, try to use the dynamic "Current Market Size" field from Airtable
    if (program.currentMarketSize && program.currentMarketSize > 0) {
      return program.currentMarketSize;
    }
    
    // Fallback: Look for market size indicators in text
    const text = `${program.programInfo || ''} ${program.vendorInsights || ''}`.toLowerCase();
    
    // Look for market size indicators
    const marketSizeMatch = text.match(/market size[:\s]*(\d{1,3}(?:,\d{3})*)\s*students/);
    if (marketSizeMatch) {
      return parseInt(marketSizeMatch[1].replace(/,/g, ''));
    }
    
    // Look for enrollment numbers
    const enrollmentMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*students/);
    if (enrollmentMatch) {
      return parseInt(enrollmentMatch[1].replace(/,/g, ''));
    }
    
    // Look for specific program sizes
    const programSizeMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:families|participants|enrollees)/);
    if (programSizeMatch) {
      return parseInt(programSizeMatch[1].replace(/,/g, ''));
    }
    
    // Accurate enrollment data based on program information
    const stateEstimates: Record<string, number> = {
      // Data found in program info/vendor insights + web research
      'Arizona': 83704, // 83,704 students enrolled (2025-26, most recent)
      'Iowa': 18000, // More than 18,000 students participated (2023-24)
      'Tennessee': 2088, // ~2,088 students in 2023–24
      'Indiana': 862, // Market size: 862 students (2024-2025)
      'Mississippi': 345, // Market size: 345 students, 90 schools (2024-2025)
      
      // Florida programs - ACTUAL 2024-25 ENROLLMENT DATA
      'Florida': 429585, // FES-EO: 307,609 + FES-UA: 122,051 students (2024-25)
      
      // Texas - not yet launched
      'Texas': 0, // Program begins 2026-27, priority phases
      
      // Other states - web research + program scope
      'Louisiana': 2000, // Phase 1 launch 2025
      'Utah': 10000, // 10,000 students eligible (up from 5,000) 2024-25
      'Georgia': 3000, // New 2025 program, priority zones only
      'Alabama': 1000, // 500 special needs priority, scaling slowly
      'South Carolina': 5000, // 5k students 2024-25, scaling to 15k
      'North Carolina': 3000, // Disability-based ESA
      'Wyoming': 1500, // New universal program starting 2025
      'Montana': 500, // IDEA-only, litigation pending
      'Alaska': 300, // Correspondence school program
      'Idaho': 1200, // Ended new enrollments for 2025-26
      'Kansas': 0, // Program ended Jan 31 2025
      'Ohio': 0, // COVID relief funds, no new enrollments
      'West Virginia': 8000, // Established program
      'Arkansas': 4000, // ClassWallet-based program
      'Missouri': 6000, // Statewide ESA
      'Wisconsin': 0, // No current ESA program
      'Oklahoma': 0, // No current ESA program
      'New Hampshire': 4000, // Education Freedom Account
      'South Dakota': 0, // No current ESA program
      'North Dakota': 0, // No current ESA program
      'Nebraska': 0, // No current ESA program
      'Kentucky': 0 // No current ESA program
    };
    
    return stateEstimates[program.state] || 1000;
  };

  const calculateTotalMarketValue = (program: any): number => {
    const perStudentAmount = parseAmount(program.annualAmount);
    const marketSize = extractMarketSize(program);
    return perStudentAmount * marketSize;
  };

  const calculateStateRevenue = (programs: ESAProgram[]): number => {
    return programs.reduce((sum, p) => sum + calculateTotalMarketValue(p), 0);
  };

  const getDominantPortal = (programs: ESAProgram[]): string => {
    const portalCount = programs.reduce((acc, p) => {
      acc[p.portalTechnology] = (acc[p.portalTechnology] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(portalCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Mixed';
  };

  const calculateAvgComplexity = (programs: ESAProgram[]): number => {
    return programs.reduce((sum, p) => sum + (p.complexityScore || 0), 0) / programs.length;
  };

  const calculateStateOpportunity = (programs: ESAProgram[]): 'High' | 'Medium' | 'Low' => {
    const highCount = programs.filter(p => p.revenueOpportunity === 'High').length;
    const totalRevenue = calculateStateRevenue(programs);
    const avgComplexity = calculateAvgComplexity(programs);
    
    // High opportunity: programs with high total market value
    if (highCount >= 1 || totalRevenue > 500000000) return 'High'; // $500M+ market
    // Medium opportunity: good total market value with manageable complexity
    if (totalRevenue > 100000000 && avgComplexity < 60) return 'Medium'; // $100M+ market
    if (totalRevenue > 50000000) return 'Medium'; // $50M+ market regardless of complexity
    return 'Low';
  };

  const filteredAndSortedStates = stateData
    .filter(state => filterPortal === 'All' || state.dominantPortal === filterPortal)
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue': return b.totalRevenue - a.totalRevenue;
        case 'complexity': return a.complexityScore - b.complexityScore;
        case 'alphabetical': return a.state.localeCompare(b.state);
        default: return 0;
      }
    });

  const getStateColor = (state: StateData): string => {
    if (state.revenueOpportunity === 'High') return 'bg-green-500';
    if (state.revenueOpportunity === 'Medium') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getComplexityColor = (score: number): string => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPortalFees = (portalTechnology: string): string => {
    switch (portalTechnology) {
      case 'ClassWallet': return '2.5% platform fees';
      case 'Step Up For Students': return '~3% processing fees';
      case 'Odyssey': return '~2% platform fees';
      case 'Student First': return 'Variable fees';
      default: return 'Manual processing';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ESA marketplace data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ESA Market Intelligence</h1>
              <p className="text-lg text-gray-600 mt-1">Interactive Revenue Opportunity Map</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                25 Jurisdictions • $8B+ Market
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
              {stateData.filter(s => s.revenueOpportunity === 'High').length}
            </div>
            <div className="text-sm text-gray-600">High Opportunity</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${(stateData.reduce((sum, s) => sum + s.totalRevenue, 0) / 1000000000).toFixed(1)}B
            </div>
            <div className="text-sm text-gray-600">Total Market Size</div>
            <div className="text-xs text-gray-500 mt-1">
              {stateData.reduce((sum, s) => sum + s.programs.reduce((pSum, p) => pSum + extractMarketSize(p), 0), 0).toLocaleString()} students
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stateData.reduce((sum, s) => sum + s.complexityScore, 0) / stateData.length)}
            </div>
            <div className="text-sm text-gray-600">Avg Complexity</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Portal</label>
              <select
                value={filterPortal}
                onChange={(e) => setFilterPortal(e.target.value)}
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
                onChange={(e) => setSortBy(e.target.value as any)}
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

        {/* US Map Visualization */}
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
              </defs>
              
              {/* Proper US Continental Outline based on SVG map standards */}
              <path 
                d="M 200 120 
                   L 800 120
                   L 850 140
                   L 880 180
                   L 900 220
                   L 920 260
                   L 930 300
                   L 920 340
                   L 900 380
                   L 880 420
                   L 850 450
                   L 800 470
                   L 750 480
                   L 700 485
                   L 650 488
                   L 600 490
                   L 550 488
                   L 500 485
                   L 450 480
                   L 400 470
                   L 350 450
                   L 300 420
                   L 250 380
                   L 220 340
                   L 200 300
                   L 190 260
                   L 185 220
                   L 190 180
                   L 200 140
                   Z"
                fill="url(#mapGrid)" 
                stroke="#64748b" 
                strokeWidth="2"
                className="drop-shadow-sm"
              />
              
              {/* Florida Peninsula */}
              <path 
                d="M 780 420 
                   L 790 450 
                   L 795 480 
                   L 790 510 
                   L 785 530
                   L 775 535
                   L 765 530
                   L 760 510
                   L 765 480
                   L 770 450
                   L 775 430
                   Z"
                fill="url(#mapGrid)" 
                stroke="#64748b" 
                strokeWidth="2"
              />
              
              {/* Texas Gulf Coast */}
              <path 
                d="M 400 420
                   L 380 450
                   L 390 480
                   L 420 490
                   L 450 485
                   L 470 470
                   L 460 450
                   L 440 430
                   L 420 425
                   Z"
                fill="url(#mapGrid)" 
                stroke="#64748b" 
                strokeWidth="2"
              />
              
              {/* California Coast */}
              <path 
                d="M 200 160
                   L 180 200
                   L 175 240
                   L 180 280
                   L 185 320
                   L 190 360
                   L 200 400
                   L 210 420
                   L 220 400
                   L 215 360
                   L 210 320
                   L 215 280
                   L 220 240
                   L 215 200
                   L 210 160
                   Z"
                fill="url(#mapGrid)" 
                stroke="#64748b" 
                strokeWidth="2"
              />
              
              {/* Great Lakes */}
              <ellipse cx="650" cy="250" rx="35" ry="12" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
              <ellipse cx="680" cy="265" rx="20" ry="8" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
              <ellipse cx="620" cy="275" rx="15" ry="6" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" opacity="0.8"/>
              
              {/* ESA Program States */}
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
        </div>

        {/* Interactive State Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">State Opportunity Matrix</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredAndSortedStates.map((state) => (
              <div
                key={state.state}
                onClick={() => setSelectedState(selectedState === state.state ? null : state.state)}
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

        {/* State Details Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedState ? `${selectedState} Programs` : 'All State Programs'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Click a state above to filter, or view all programs below
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Window</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedStates
                  .filter(state => !selectedState || state.state === selectedState)
                  .flatMap(state => 
                    state.programs.map((program, idx) => (
                      <tr key={`${state.state}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 ${getStateColor(state)} rounded-full mr-3`}></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{state.state}</div>
                              <div className="text-xs text-gray-500">{program.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">${(calculateTotalMarketValue(program) / 1000000).toFixed(1)}M</div>
                          <div className="text-xs text-gray-500">${parseAmount(program.annualAmount).toLocaleString()}/student</div>
                          <div className={`text-xs ${
                            program.revenueOpportunity === 'High' ? 'text-green-600' :
                            program.revenueOpportunity === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {program.revenueOpportunity} opportunity
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {program.priceParity ? '⚠️ Price parity required' : '✅ No price parity'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {program.portalTechnology || 'Manual'}
                            </span>
                            <div className="text-xs text-gray-500">
                              {getPortalFees(program.portalTechnology)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${getComplexityColor(program.complexityScore || 0)}`}>
                            {program.complexityScore || 0}/100
                          </div>
                          <div className="text-xs text-gray-500">
                            {(program.complexityScore || 0) < 30 ? 'Easy' : 
                             (program.complexityScore || 0) < 60 ? 'Medium' : 'Complex'}
                          </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900">View Details</button>
                        </td>
                      </tr>
                    ))
                  )
                }
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
};// Force rebuild 1751907270
