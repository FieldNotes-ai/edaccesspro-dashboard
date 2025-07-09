import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import InteractiveUSMap from '../components/dashboard/InteractiveUSMap';
import ControlTower from '../components/ControlTower';
import { COOOrchestrator } from '../agents/cooOrchestrator';

interface ESAProgram {
  id: string;
  state: string;
  name: string;
  portalTechnology: string;
  annualAmount: string;
  currentMarketSize?: number;
  programStatus: string;
  currentWindowStatus: string;
  activeProductVendors?: number;
  activeServiceVendors?: number;
  platformFee?: number;
  adminFee?: number;
  marketSize?: number;
  paymentTiming?: string;
  vendorApprovalTime?: string;
  effortToValueRatio?: number;
  complexityScore?: number;
}

interface StateData {
  state: string;
  programs: ESAProgram[];
  totalRevenue: number;
  studentCount: number;
  complexity: 'Low' | 'Medium' | 'High';
  activeProductVendors?: number;
  activeServiceVendors?: number;
  avgPlatformFee?: number;
  avgAdminFee?: number;
}

export default function ConsolidatedDashboard() {
  const [programs, setPrograms] = useState<ESAProgram[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [orchestrator] = useState(() => new COOOrchestrator());
  const [showControlTower, setShowControlTower] = useState(true);

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

  const fetchData = async (attempt: number = 0) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    try {
      setError(null);
      console.log(`Fetching data (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/data?action=programs', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      const programList = data.programs || [];
      
      // Validate programs array
      if (!Array.isArray(programList)) {
        throw new Error('Programs data is not an array');
      }
      
      console.log(`Successfully loaded ${programList.length} programs`);
      
      setPrograms(programList);
      setStateData(processStateData(programList));
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to load data (attempt ${attempt + 1}):`, errorMessage);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        setRetryCount(attempt + 1);
        
        setTimeout(() => {
          fetchData(attempt + 1);
        }, delay);
        return;
      }
      
      // All retries failed - set error state and use fallback data
      setError(`Failed to load data after ${maxRetries + 1} attempts: ${errorMessage}`);
      console.warn('Using fallback enrollment data due to API failure');
      
      // Create fallback programs from hardcoded data
      const fallbackPrograms = createFallbackPrograms();
      setPrograms(fallbackPrograms);
      setStateData(processStateData(fallbackPrograms));
      
    } finally {
      setLoading(false);
    }
  };

  const createFallbackPrograms = (): ESAProgram[] => {
    return Object.entries(ENROLLMENT_DATA).map(([state, enrollment], index) => ({
      id: `fallback-${index}`,
      name: `${state} Education Savings Account Program`,
      state,
      portalTechnology: 'Manual',
      annualAmount: 'Varies by student',
      currentMarketSize: enrollment,
      programStatus: 'Active',
      currentWindowStatus: 'Open',
      activeProductVendors: 0,
      activeServiceVendors: 0,
      platformFee: 0,
      adminFee: 0,
      marketSize: enrollment,
      paymentTiming: 'Monthly',
      vendorApprovalTime: '2-4 weeks',
      effortToValueRatio: 0,
      complexityScore: 0,
    }));
  };

  const sanitizeAnnualAmount = (rawAmount: string): string => {
    if (!rawAmount || typeof rawAmount !== 'string') {
      return 'Not specified';
    }
    
    // Remove URL fragments and tracking codes
    let cleaned = rawAmount.replace(/[a-z]+\.[a-z]+\+\d+/g, '');
    
    // Replace <br> tags with line breaks
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    
    // Clean up extra whitespace but preserve line breaks
    cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();
    
    // Remove any remaining HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Clean up bullet points and formatting
    cleaned = cleaned.replace(/•\s*/g, '• ');
    
    // Remove trailing URLs and codes
    cleaned = cleaned.replace(/\s+[a-z]+\.[a-z]+.*$/i, '');
    
    return cleaned || 'Not specified';
  };

  const getMarketSize = (program: ESAProgram): number => {
    if (program.marketSize && program.marketSize > 0) {
      return program.marketSize;
    }
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
          {retryCount > 0 && (
            <p className="mt-2 text-sm text-yellow-600">
              Retrying... (Attempt {retryCount + 1}/4)
            </p>
          )}
        </div>
      </div>
    );
  }

        {/* Control Tower Section */}
        {showControlTower && (
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Agent Control Tower</h3>
                  <button
                    onClick={() => setShowControlTower(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ✕
                  </button>
                </div>
                <ControlTower orchestrator={orchestrator} />
              </div>
            </div>
          </div>
        )}
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Data Loading Issue
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-1">Showing fallback data. Please refresh the page to try again.</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 px-3 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

        {/* Interactive US Map Visualization */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ESA Market Map</h2>
          <InteractiveUSMap 
            stateData={stateData}
            selectedState={selectedState}
            onStateSelect={setSelectedState}
          />
          
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
          
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {(selectedState ? 
                stateData.find(s => s.state === selectedState)?.programs || [] : 
                programs
              ).map((program) => (
                <div key={program.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-500">{program.state}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      program.currentWindowStatus === 'Open' ? 'bg-green-100 text-green-800' :
                      program.currentWindowStatus === 'Opening Soon' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {program.currentWindowStatus || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Market Size:</span>
                      <p className="text-gray-900">{getMarketSize(program).toLocaleString()} students</p>
                      <p className="text-xs text-gray-500">${((getMarketSize(program) * 8000) / 1000000).toFixed(0)}M potential</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Annual Amount:</span>
                      <p className="text-gray-900 whitespace-pre-line">{sanitizeAnnualAmount(program.annualAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Portal:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        program.portalTechnology === 'ClassWallet' ? 'bg-blue-100 text-blue-800' :
                        program.portalTechnology === 'Odyssey' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {program.portalTechnology || 'Manual'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Fees:</span>
                      <p className="text-gray-900">
                        Platform: {program.platformFee ? `${program.platformFee}%` : 'None'}
                        <br />
                        Admin: {program.adminFee ? `${program.adminFee}%` : 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Program</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Market Size</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Annual Amount</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Portal</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Platform Fee</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Admin Fee</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(selectedState ? 
                    stateData.find(s => s.state === selectedState)?.programs || [] : 
                    programs
                  ).map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{program.name}</div>
                        <div className="text-sm text-gray-500">{program.state}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getMarketSize(program).toLocaleString()} students
                        </div>
                        <div className="text-xs text-gray-500">
                          ${((getMarketSize(program) * 8000) / 1000000).toFixed(0)}M potential
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="whitespace-pre-line">{sanitizeAnnualAmount(program.annualAmount)}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          program.portalTechnology === 'ClassWallet' ? 'bg-blue-100 text-blue-800' :
                          program.portalTechnology === 'Odyssey' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {program.portalTechnology || 'Manual'}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.platformFee ? `${program.platformFee}%` : 'None'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.adminFee ? `${program.adminFee}%` : 'None'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
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
};// FORCE VERCEL REBUILD 1751911212
// Force rebuild 1751913025
