import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  CogIcon,
  FunnelIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  EyeIcon,
  LockClosedIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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
  // Enhanced operational intelligence fields
  backgroundCheckRequired: boolean;
  insuranceRequired: boolean;
  insuranceMinimum: number;
  renewalRequired: boolean;
  renewalFrequency: string;
  requiredDocuments: string;
  documentUpload: string;
  submissionMethod: string;
  vendorPaymentMethod: string;
  priceParity: boolean;
  currentWindowStatus: string;
  annualAmount: string;
  eligibleProducts: string;
}

interface UserSubscription {
  tier: 'Free' | 'Starter' | 'Professional' | 'Enterprise';
  features: string[];
}

interface DashboardProps {
  userSubscription: UserSubscription;
}

export default function EnhancedDashboard({ userSubscription = { tier: 'Enterprise', features: [] } }: DashboardProps) {
  const [programs, setPrograms] = useState<ESAProgram[]>([]);
  const [supplementaryPrograms, setSupplementaryPrograms] = useState<ESAProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedPortal, setSelectedPortal] = useState('');
  const [showSupplementary, setShowSupplementary] = useState(false);
  const [selectedView, setSelectedView] = useState<'cards' | 'table'>('cards');
  const [showOperationalDetails, setShowOperationalDetails] = useState(true);
  const [selectedProgramForModal, setSelectedProgramForModal] = useState<ESAProgram | null>(null);
  
  // Advanced filters
  const [filterBackgroundCheck, setFilterBackgroundCheck] = useState('');
  const [filterInsurance, setFilterInsurance] = useState('');
  const [filterRenewal, setFilterRenewal] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  
  // Subscription-based feature flags
  const canViewOperationalIntelligence = ['Professional', 'Enterprise'].includes(userSubscription.tier);
  const canViewDetailedAnalytics = ['Enterprise'].includes(userSubscription.tier);
  const canExportData = ['Professional', 'Enterprise'].includes(userSubscription.tier);
  const maxProgramsVisible = {
    'Free': 5,
    'Starter': 15,
    'Professional': 30,
    'Enterprise': Infinity
  }[userSubscription.tier];

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/airtable?action=enhanced-programs');
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

  const getOperationalScore = (program: ESAProgram): number => {
    let score = 0;
    if (program.backgroundCheckRequired === false) score += 2; // Easier entry
    if (program.insuranceRequired === false) score += 2;
    if (program.renewalRequired === false) score += 1;
    if (program.submissionMethod === 'Online Portal') score += 1;
    if (program.portalTechnology === 'ClassWallet') score += 1; // Most vendor-friendly
    return Math.min(score, 5);
  };
  
  const getScoreColor = (score: number): string => {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const getScoreLabel = (score: number): string => {
    if (score >= 4) return 'Vendor Friendly';
    if (score >= 3) return 'Moderate Barriers';
    return 'High Barriers';
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !selectedState || program.state === selectedState;
    const matchesPortal = !selectedPortal || program.portalTechnology === selectedPortal;
    
    // Advanced filters
    let matchesBackgroundCheck = true;
    if (filterBackgroundCheck === 'required') matchesBackgroundCheck = program.backgroundCheckRequired;
    if (filterBackgroundCheck === 'not-required') matchesBackgroundCheck = !program.backgroundCheckRequired;
    
    let matchesInsurance = true;
    if (filterInsurance === 'required') matchesInsurance = program.insuranceRequired;
    if (filterInsurance === 'not-required') matchesInsurance = !program.insuranceRequired;
    
    let matchesRenewal = true;
    if (filterRenewal === 'required') matchesRenewal = program.renewalRequired;
    if (filterRenewal === 'not-required') matchesRenewal = !program.renewalRequired;
    
    let matchesDifficulty = true;
    if (filterDifficulty) {
      const score = getOperationalScore(program);
      if (filterDifficulty === 'easy') matchesDifficulty = score >= 4;
      if (filterDifficulty === 'moderate') matchesDifficulty = score === 3;
      if (filterDifficulty === 'difficult') matchesDifficulty = score <= 2;
    }
    
    return matchesSearch && matchesState && matchesPortal && 
           matchesBackgroundCheck && matchesInsurance && matchesRenewal && matchesDifficulty;
  }).slice(0, maxProgramsVisible);
  
  const limitReached = programs.length > maxProgramsVisible && filteredPrograms.length === maxProgramsVisible;

  const uniqueStates = Array.from(new Set(programs.map(p => p.state))).sort();
  const uniquePortals = Array.from(new Set(programs.map(p => p.portalTechnology))).filter(Boolean).sort();

  const getPortalColor = (portal: string) => {
    switch (portal) {
      case 'ClassWallet': return 'bg-green-100 text-green-800';
      case 'Odyssey': return 'bg-blue-100 text-blue-800';
      case 'Student First Technologies': return 'bg-purple-100 text-purple-800';
      case 'Student First': return 'bg-purple-100 text-purple-800';
      case 'Other': return 'bg-orange-100 text-orange-800';
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
  
  const getRequirementIcon = (required: boolean) => {
    return required ? 
      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" /> : 
      <DocumentCheckIcon className="h-4 w-4 text-green-500" />;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedPortal('');
    setFilterBackgroundCheck('');
    setFilterInsurance('');
    setFilterRenewal('');
    setFilterDifficulty('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enhanced ESA intelligence...</p>
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
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">EdAccessPro Intelligence Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">Advanced ESA Program Operational Intelligence</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                ✓ Live Data
              </div>
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {programs.length} ESA Programs
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center ${
                userSubscription.tier === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                userSubscription.tier === 'Professional' ? 'bg-blue-100 text-blue-800' :
                userSubscription.tier === 'Starter' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <UserGroupIcon className="h-4 w-4 mr-1" />
                {userSubscription.tier} Plan
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Filters & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FunnelIcon className="h-5 w-5 mr-2" />
                Program Intelligence Filters
              </h3>
              {canViewOperationalIntelligence && (
                <button
                  onClick={() => setShowOperationalDetails(!showOperationalDetails)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    showOperationalDetails 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showOperationalDetails ? 'Hide' : 'Show'} Operational Intelligence
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedView('cards')}
                className={`p-2 rounded-lg ${
                  selectedView === 'cards' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H4zM4 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H4zM12 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM12 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedView('table')}
                className={`p-2 rounded-lg ${
                  selectedView === 'table' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <DocumentTextIcon className="h-4 w-4" />
              </button>
              {canExportData && (
                <button className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                  Export Data
                </button>
              )}
            </div>
          </div>
          
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
              <option value="">All States ({uniqueStates.length})</option>
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
              <option value="">All Platforms ({uniquePortals.length})</option>
              {uniquePortals.map(portal => (
                <option key={portal} value={portal}>{portal}</option>
              ))}
            </select>
            
            {/* Quick Filter Buttons */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilterDifficulty(filterDifficulty === 'easy' ? '' : 'easy')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  filterDifficulty === 'easy' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                ✓ Vendor Friendly
              </button>
              <button 
                onClick={() => setSelectedPortal(selectedPortal === 'ClassWallet' ? '' : 'ClassWallet')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPortal === 'ClassWallet' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                💳 ClassWallet
              </button>
            </div>
          </div>
          
          {/* Advanced Operational Filters - Professional/Enterprise Only */}
          {showOperationalDetails && canViewOperationalIntelligence && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-1" />
                    Background Check
                  </label>
                  <select 
                    value={filterBackgroundCheck}
                    onChange={(e) => setFilterBackgroundCheck(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Any</option>
                    <option value="required">Required</option>
                    <option value="not-required">Not Required</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Insurance Required
                  </label>
                  <select 
                    value={filterInsurance}
                    onChange={(e) => setFilterInsurance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Any</option>
                    <option value="required">Required</option>
                    <option value="not-required">Not Required</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Renewal Required
                  </label>
                  <select 
                    value={filterRenewal}
                    onChange={(e) => setFilterRenewal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Any</option>
                    <option value="required">Required</option>
                    <option value="not-required">Not Required</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <DocumentCheckIcon className="h-4 w-4 mr-1" />
                    Entry Difficulty
                  </label>
                  <select 
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Any Difficulty</option>
                    <option value="easy">Easy Entry</option>
                    <option value="moderate">Moderate Barriers</option>
                    <option value="difficult">High Barriers</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Subscription Upgrade Prompt */}
          {!canViewOperationalIntelligence && (
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LockClosedIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">Unlock Operational Intelligence</h4>
                      <p className="text-sm text-blue-700">Background checks, insurance requirements, renewal policies, and vendor entry barriers.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredPrograms.length}</span> of <span className="font-semibold">{programs.length}</span> ESA programs
              </span>
              {limitReached && (
                <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {userSubscription.tier} plan limit reached
                  <button className="ml-2 text-yellow-900 hover:text-yellow-700 font-medium">
                    Upgrade
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {(searchTerm || selectedState || selectedPortal || filterBackgroundCheck || filterInsurance || filterRenewal || filterDifficulty) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Clear all filters
                </button>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Powered by real-time ESA intelligence</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ESA Programs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">ESA Program Intelligence</h2>
            {canViewDetailedAnalytics && (
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Advanced Analytics Available</span>
              </div>
            )}
          </div>

          {selectedView === 'cards' ? (
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
                      {canViewOperationalIntelligence && (
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(getOperationalScore(program))}`}>
                            {getScoreLabel(getOperationalScore(program))}
                          </span>
                          <div className="text-xs text-gray-500">
                            Score: {getOperationalScore(program)}/5
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Portal Technology & Status */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPortalColor(program.portalTechnology)}`}>
                        <CogIcon className="h-3 w-3 mr-1" />
                        {program.portalTechnology || 'Unknown'}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {program.status || 'Unknown'}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.currentWindowStatus === 'Open' ? 'bg-green-100 text-green-800' :
                        program.currentWindowStatus === 'Closed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {program.currentWindowStatus || 'Unknown'}
                      </span>
                    </div>
                    
                    {/* Operational Intelligence - Professional/Enterprise Only */}
                    {canViewOperationalIntelligence && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                          <ShieldCheckIcon className="h-4 w-4 mr-1" />
                          Vendor Requirements
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Background Check:</span>
                            <div className="flex items-center">
                              {getRequirementIcon(program.backgroundCheckRequired)}
                              <span className={`ml-1 ${
                                program.backgroundCheckRequired ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {program.backgroundCheckRequired ? 'Required' : 'Not Required'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Insurance:</span>
                            <div className="flex items-center">
                              {getRequirementIcon(program.insuranceRequired)}
                              <span className={`ml-1 ${
                                program.insuranceRequired ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {program.insuranceRequired ? `$${program.insuranceMinimum.toLocaleString()}` : 'Not Required'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Renewal:</span>
                            <div className="flex items-center">
                              {getRequirementIcon(program.renewalRequired)}
                              <span className={`ml-1 ${
                                program.renewalRequired ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {program.renewalRequired ? program.renewalFrequency || 'Required' : 'Never'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Submission:</span>
                            <span className="text-gray-900 font-medium">
                              {program.submissionMethod || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        {program.vendorPaymentMethod && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 flex items-center">
                                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                Payment Method:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {program.vendorPaymentMethod}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Free/Starter Plan - Limited Info */}
                    {!canViewOperationalIntelligence && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <LockClosedIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">Operational Intelligence</span>
                          </div>
                          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Upgrade to View
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Data Freshness */}
                    <div className="mb-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getFreshnessColor(program.dataFreshness)}`}>
                        Data: {program.dataFreshness || 'Unknown'}
                      </span>
                    </div>

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
                      <button
                        onClick={() => setSelectedProgramForModal(program)}
                        className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View - Professional/Enterprise Feature */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        State
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {canViewOperationalIntelligence && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Background Check
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Insurance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendor Score
                          </th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPrograms.map((program) => (
                      <tr key={program.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{program.name}</div>
                            <div className="text-sm text-gray-500">{program.programType}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {program.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPortalColor(program.portalTechnology)}`}>
                            {program.portalTechnology || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            program.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {program.status || 'Unknown'}
                          </span>
                        </td>
                        {canViewOperationalIntelligence && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                {getRequirementIcon(program.backgroundCheckRequired)}
                                <span className={`ml-1 ${
                                  program.backgroundCheckRequired ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {program.backgroundCheckRequired ? 'Required' : 'Not Required'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                {getRequirementIcon(program.insuranceRequired)}
                                <span className={`ml-1 ${
                                  program.insuranceRequired ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {program.insuranceRequired ? `$${program.insuranceMinimum.toLocaleString()}` : 'Not Required'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(getOperationalScore(program))}`}>
                                {getOperationalScore(program)}/5
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {program.portalUrl && (
                              <a
                                href={program.portalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Portal
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedProgramForModal(program)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-sm mx-auto">
                <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No ESA programs match your current filters.</p>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your search criteria or clearing filters to see more results.</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Program Detail Modal */}
        {selectedProgramForModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedProgramForModal.name}
                </h3>
                <button
                  onClick={() => setSelectedProgramForModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">State</label>
                    <p className="text-sm text-gray-900">{selectedProgramForModal.state}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Program Type</label>
                    <p className="text-sm text-gray-900">{selectedProgramForModal.programType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Portal Technology</label>
                    <p className="text-sm text-gray-900">{selectedProgramForModal.portalTechnology}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-sm text-gray-900">{selectedProgramForModal.status}</p>
                  </div>
                </div>

                {/* Operational Intelligence */}
                {canViewOperationalIntelligence && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Operational Requirements</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Background Check Required</label>
                        <p className={`text-sm ${selectedProgramForModal.backgroundCheckRequired ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedProgramForModal.backgroundCheckRequired ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Insurance Required</label>
                        <p className={`text-sm ${selectedProgramForModal.insuranceRequired ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedProgramForModal.insuranceRequired ? `Yes - $${selectedProgramForModal.insuranceMinimum.toLocaleString()}` : 'No'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Renewal Required</label>
                        <p className={`text-sm ${selectedProgramForModal.renewalRequired ? 'text-yellow-600' : 'text-green-600'}`}>
                          {selectedProgramForModal.renewalRequired ? selectedProgramForModal.renewalFrequency : 'Never'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Submission Method</label>
                        <p className="text-sm text-gray-900">{selectedProgramForModal.submissionMethod || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    {selectedProgramForModal.vendorPaymentMethod && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Payment Method</label>
                        <p className="text-sm text-gray-900">{selectedProgramForModal.vendorPaymentMethod}</p>
                      </div>
                    )}
                    
                    {selectedProgramForModal.requiredDocuments && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Required Documents</label>
                        <p className="text-sm text-gray-900">{selectedProgramForModal.requiredDocuments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 flex space-x-3">
                  {selectedProgramForModal.portalUrl && (
                    <a
                      href={selectedProgramForModal.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Visit Vendor Portal
                    </a>
                  )}
                  {selectedProgramForModal.website && (
                    <a
                      href={selectedProgramForModal.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Program Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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