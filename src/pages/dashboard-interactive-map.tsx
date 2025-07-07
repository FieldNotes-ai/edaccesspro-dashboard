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
      const totalRevenue = programs.reduce((sum, p) => sum + extractMarketSize(p), 0);
      const avgComplexity = programs.reduce((sum, p) => sum + (p.complexityScore || 0), 0) / programs.length;
      
      return {
        state,
        programs,
        totalRevenue,
        dominantPortal: getMostCommonPortal(programs),
        complexityScore: Math.round(avgComplexity),
        revenueOpportunity: totalRevenue > 100000 ? 'High' : totalRevenue > 50000 ? 'Medium' : 'Low',
        vendorCount: programs.length
      };
    });
  };

  const calculateComplexityScore = (program: any): number => {
    let score = 0;
    if (program.portalTechnology === 'ClassWallet') score += 30;
    else if (program.portalTechnology === 'Odyssey') score += 20;
    else score += 10;
    
    if (program.vendorPaymentMethod?.includes('Direct')) score += 20;
    if (program.currentWindowStatus === 'Closed') score += 15;
    
    return Math.min(score, 100);
  };

  const calculateRevenueOpportunity = (program: any): 'High' | 'Medium' | 'Low' => {
    const marketSize = extractMarketSize(program);
    if (marketSize > 100000) return 'High';
    if (marketSize > 50000) return 'Medium';
    return 'Low';
  };

  const extractMarketSize = (program: any): number => {
    if (program.currentMarketSize) {
      return parseInt(program.currentMarketSize.toString().replace(/[^0-9]/g, '')) || 0;
    }
    return 0;
  };

  const getMostCommonPortal = (programs: ESAProgram[]): string => {
    const portalCounts = programs.reduce((acc, p) => {
      acc[p.portalTechnology] = (acc[p.portalTechnology] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(portalCounts).reduce((a, b) => 
      portalCounts[a] > portalCounts[b] ? a : b
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ESA market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ESA Market Intelligence Dashboard
          </h1>
          <p className="text-gray-600">
            Interactive state-by-state analysis of ESA program opportunities
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total States</h3>
            <p className="text-3xl font-bold text-blue-600">{stateData.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Programs</h3>
            <p className="text-3xl font-bold text-green-600">
              {stateData.reduce((sum, state) => sum + state.programs.length, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">High Opportunity</h3>
            <p className="text-3xl font-bold text-purple-600">
              {stateData.filter(state => state.revenueOpportunity === 'High').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Market</h3>
            <p className="text-3xl font-bold text-orange-600">
              ${(stateData.reduce((sum, state) => sum + state.totalRevenue, 0) / 1000000000).toFixed(1)}B
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Portal
              </label>
              <select
                value={filterPortal}
                onChange={(e) => setFilterPortal(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="All">All Portals</option>
                <option value="ClassWallet">ClassWallet</option>
                <option value="Odyssey">Odyssey</option>
                <option value="Generic">Generic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="revenue">Revenue Opportunity</option>
                <option value="complexity">Complexity Score</option>
                <option value="alphabetical">State Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* State Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stateData
            .filter(state => filterPortal === 'All' || state.dominantPortal === filterPortal)
            .sort((a, b) => {
              if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
              if (sortBy === 'complexity') return a.complexityScore - b.complexityScore;
              return a.state.localeCompare(b.state);
            })
            .map((state) => (
              <div
                key={state.state}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
                onClick={() => setSelectedState(selectedState === state.state ? null : state.state)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{state.state}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    state.revenueOpportunity === 'High' ? 'bg-green-100 text-green-800' :
                    state.revenueOpportunity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {state.revenueOpportunity}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Programs:</span>
                    <span className="font-medium">{state.programs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Size:</span>
                    <span className="font-medium">
                      {state.totalRevenue > 1000000 
                        ? `${(state.totalRevenue / 1000000).toFixed(1)}M`
                        : `${(state.totalRevenue / 1000).toFixed(0)}K`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dominant Portal:</span>
                    <span className="font-medium">{state.dominantPortal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity:</span>
                    <span className="font-medium">{state.complexityScore}/100</span>
                  </div>
                </div>

                {selectedState === state.state && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Programs:</h4>
                    <div className="space-y-2">
                      {state.programs.map((program) => (
                        <div key={program.id} className="text-sm">
                          <div className="font-medium">{program.name}</div>
                          <div className="text-gray-500">
                            {program.portalTechnology} • {program.annualAmount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { tier } = context.query;
  
  // Redirect based on tier
  if (tier === 'free' || tier === 'starter') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return { props: {} };
};