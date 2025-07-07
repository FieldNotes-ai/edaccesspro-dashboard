import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { StateData, SortOption, FilterOption } from '../components/dashboard/types';
import { processStateData, filterAndSortStates } from '../components/dashboard/dataProcessing';
import { extractMarketSize, getPortalFees, getComplexityColor } from '../components/dashboard/utils';
import USMapVisualization from '../components/dashboard/USMapVisualization';
import StateGrid from '../components/dashboard/StateGrid';
import DashboardControls from '../components/dashboard/DashboardControls';

export default function OptimizedDashboard() {
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [filterPortal, setFilterPortal] = useState<FilterOption>('All');
  const [sortBy, setSortBy] = useState<SortOption>('revenue');
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

  const filteredAndSortedStates = filterAndSortStates(stateData, filterPortal, sortBy);

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

        {/* Controls */}
        <DashboardControls
          filterPortal={filterPortal}
          sortBy={sortBy}
          onFilterChange={setFilterPortal}
          onSortChange={setSortBy}
        />

        {/* US Map */}
        <USMapVisualization
          stateData={filteredAndSortedStates}
          selectedState={selectedState}
          onStateSelect={setSelectedState}
        />

        {/* State Grid */}
        <StateGrid
          stateData={filteredAndSortedStates}
          selectedState={selectedState}
          onStateSelect={setSelectedState}
        />

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal Technology</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(selectedState ? 
                  stateData.find(s => s.state === selectedState)?.programs || [] : 
                  filteredAndSortedStates.flatMap(s => s.programs)
                ).map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{program.name}</div>
                      <div className="text-sm text-gray-500">{program.state}</div>
                      <div className="text-xs text-gray-400">
                        {program.priceParity ? '⚠️ Price parity required' : '✅ No price parity'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {extractMarketSize(program).toLocaleString()} students
                      </div>
                      <div className="text-xs text-gray-500">
                        ${((extractMarketSize(program) * 8000) / 1000000).toFixed(0)}M potential
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.annualAmount || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          program.portalTechnology === 'ClassWallet' ? 'bg-blue-100 text-blue-800' :
                          program.portalTechnology === 'Odyssey' ? 'bg-green-100 text-green-800' :
                          program.portalTechnology === 'Step Up For Students' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
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
};// Cache bust Mon Jul  7 12:33:21 EDT 2025
