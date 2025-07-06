import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MagnifyingGlassIcon, MapPinIcon, CogIcon } from '@heroicons/react/24/outline';

interface ESAProgram {
  id: string;
  name: string;
  state: string;
  portalTechnology: string;
  portalUrl: string;
  programType: string;
  status: string;
  dataFreshness: string;
  vendorInfo: string;
  programInfo: string;
  website: string;
  contactInfo: string;
}

export default function Dashboard() {
  const [programs, setPrograms] = useState<ESAProgram[]>([]);
  const [supplementaryPrograms, setSupplementaryPrograms] = useState<ESAProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedPortal, setSelectedPortal] = useState('');
  const [showSupplementary, setShowSupplementary] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication first
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const authCookie = getCookie('demo-auth');
    if (authCookie === 'authenticated') {
      setIsAuthenticated(true);
      fetchPrograms();
    } else {
      router.push('/login');
      return;
    }
    setAuthLoading(false);
  }, [router]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/airtable?action=programs');
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      setPrograms(data.programs || []);
      setSupplementaryPrograms(data.supplementaryPrograms || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !selectedState || program.state === selectedState;
    const matchesPortal = !selectedPortal || program.portalTechnology === selectedPortal;
    
    return matchesSearch && matchesState && matchesPortal;
  });

  const uniqueStates = Array.from(new Set(programs.map(p => p.state))).sort();
  const uniquePortals = Array.from(new Set(programs.map(p => p.portalTechnology))).filter(Boolean).sort();

  const getPortalColor = (portal: string) => {
    switch (portal) {
      case 'ClassWallet': return 'bg-green-100 text-green-800';
      case 'Odyssey': return 'bg-blue-100 text-blue-800';
      case 'Student First': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      case 'Conflicting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ESA programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">EdAccessPro Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">ESA Program Intelligence</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Live Data
              </div>
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {programs.length} ESA Programs
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs or states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            {/* Portal Technology Filter */}
            <select
              value={selectedPortal}
              onChange={(e) => setSelectedPortal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Portal Technologies</option>
              {uniquePortals.map(portal => (
                <option key={portal} value={portal}>{portal}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ESA Programs Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ESA Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Program Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{program.name}</h3>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {program.state}
                    </div>
                  </div>
                </div>

                {/* Portal Technology */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPortalColor(program.portalTechnology)}`}>
                    <CogIcon className="h-3 w-3 mr-1" />
                    {program.portalTechnology || 'Unknown'}
                  </span>
                </div>

                {/* Data Freshness */}
                <div className="mb-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getFreshnessColor(program.dataFreshness)}`}>
                    Data: {program.dataFreshness || 'Unknown'}
                  </span>
                </div>

                {/* Program Info Preview */}
                {program.programInfo && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {program.programInfo.length > 150 
                      ? `${program.programInfo.substring(0, 150)}...` 
                      : program.programInfo}
                  </p>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {program.portalUrl && (
                    <a
                      href={program.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Visit Portal
                    </a>
                  )}
                  {program.website && (
                    <a
                      href={program.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Program Info
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* No ESA Results */}
          {filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No ESA programs match your current filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('');
                  setSelectedPortal('');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Supplementary Programs Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Additional School Choice Programs</h2>
              <p className="text-gray-600 mt-1">Tax credit and voucher programs for reference</p>
            </div>
            <button
              onClick={() => setShowSupplementary(!showSupplementary)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showSupplementary ? 'Hide' : 'Show'} ({supplementaryPrograms.length})
            </button>
          </div>

          {showSupplementary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supplementaryPrograms.map((program) => (
                <div key={program.id} className="bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                  <div className="p-6">
                    {/* Program Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{program.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {program.state}
                        </div>
                      </div>
                    </div>

                    {/* Program Type */}
                    <div className="mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                        {program.programType || 'Unknown'}
                      </span>
                    </div>

                    {/* Portal Technology */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPortalColor(program.portalTechnology)}`}>
                        <CogIcon className="h-3 w-3 mr-1" />
                        {program.portalTechnology || 'Unknown'}
                      </span>
                    </div>

                    {/* Program Info Preview */}
                    {program.programInfo && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {program.programInfo.length > 150 
                          ? `${program.programInfo.substring(0, 150)}...` 
                          : program.programInfo}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {program.website && (
                        <a
                          href={program.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Program Info
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}