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
  ExclamationTriangleIcon
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

export default function Dashboard({ userSubscription = { tier: 'Enterprise', features: [] } }: DashboardProps) {
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
  
  // Advanced filters
  const [filterBackgroundCheck, setFilterBackgroundCheck] = useState('');
  const [filterInsurance, setFilterInsurance] = useState('');
  const [filterRenewal, setFilterRenewal] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [selectedProgramForModal, setSelectedProgramForModal] = useState<ESAProgram | null>(null);
  
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

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !selectedState || program.state === selectedState;
    const matchesPortal = !selectedPortal || program.portalTechnology === selectedPortal;
    
    // Advanced filters
    let matchesPriceParity = true;
    if (filterBackgroundCheck === 'required') matchesPriceParity = program.priceParity;
    if (filterBackgroundCheck === 'not-required') matchesPriceParity = !program.priceParity;
    
    let matchesPaymentMethod = true;
    if (filterInsurance === 'required') matchesPaymentMethod = program.portalTechnology === 'ClassWallet';
    if (filterInsurance === 'not-required') matchesPaymentMethod = program.portalTechnology === 'Odyssey';
    
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
           matchesPriceParity && matchesPaymentMethod && matchesRenewal && matchesDifficulty;
  }).slice(0, maxProgramsVisible);
  
  const limitReached = programs.length > maxProgramsVisible && filteredPrograms.length === maxProgramsVisible;
  
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
  
  const getRequirementIcon = (required: boolean) => {
    return required ? 
      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" /> : 
      <DocumentCheckIcon className="h-4 w-4 text-green-500" />;
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
          
          {/* Advanced Vendor Intelligence Filters - Professional/Enterprise Only */}
          {showOperationalDetails && canViewOperationalIntelligence && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <DocumentCheckIcon className="h-4 w-4 mr-1" />
                    Price Parity
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
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Renewal Frequency
                  </label>
                  <select 
                    value={filterRenewal}
                    onChange={(e) => setFilterRenewal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Any</option>
                    <option value="required">Has Renewals</option>
                    <option value="not-required">No Renewals</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Payment Method
                  </label>
                  <select 
                    value={filterInsurance}
                    onChange={(e) => setFilterInsurance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Any Payment</option>
                    <option value="required">ClassWallet</option>
                    <option value="not-required">Odyssey</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    Vendor Difficulty
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
                      <h4 className="text-sm font-semibold text-blue-900">Unlock Vendor Intelligence</h4>
                      <p className="text-sm text-blue-700">Price parity rules, payment methods, renewal frequencies, annual amounts, and vendor difficulty scoring.</p>
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
                  {canViewOperationalIntelligence && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(getOperationalScore(program))}`}>
                      {getScoreLabel(getOperationalScore(program))}
                    </span>
                  )}
                </div>
                
                {/* Vendor Intelligence - Professional/Enterprise Only */}
                {canViewOperationalIntelligence && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Key Vendor Intelligence
                    </h4>
                    <div className="space-y-3">
                      {/* Price Parity */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <DocumentCheckIcon className="h-4 w-4 text-orange-500 mr-2" />
                          <span className="text-gray-700 text-sm">Price Parity</span>
                        </div>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          program.priceParity 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {program.priceParity ? 'Required' : 'Not Required'}
                        </span>
                      </div>

                      {/* Payment Method */}
                      {program.vendorPaymentMethod && (
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700 text-sm">Payment Method</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 bg-green-100 px-2 py-1 rounded-full max-w-32 truncate">
                            {program.vendorPaymentMethod.split(',')[0]}
                          </span>
                        </div>
                      )}

                      {/* Annual Amount */}
                      {program.annualAmount && (
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-gray-700 text-sm">Annual Amount</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 bg-blue-100 px-2 py-1 rounded-full">
                            {program.annualAmount.replace(/<[^>]*>/g, '').split('•')[0].trim()}
                          </span>
                        </div>
                      )}

                      {/* Renewal Frequency */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-purple-500 mr-2" />
                          <span className="text-gray-700 text-sm">Renewal Frequency</span>
                        </div>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          program.renewalRequired 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {program.renewalRequired ? program.renewalFrequency || 'Required' : 'Never'}
                        </span>
                      </div>

                      {/* Portal Technology */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <CogIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-gray-700 text-sm">Portal Technology</span>
                        </div>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getPortalColor(program.portalTechnology)}`}>
                          {program.portalTechnology || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Program Details */}
                {canViewOperationalIntelligence && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <InformationCircleIcon className="h-3 w-3 mr-1" />
                      Additional Program Details
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Background Check:</span>
                        <span className={`${
                          program.backgroundCheckRequired ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {program.backgroundCheckRequired ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Insurance:</span>
                        <span className={`${
                          program.insuranceRequired ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {program.insuranceRequired ? `$${program.insuranceMinimum.toLocaleString()}` : 'Not Required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Submission:</span>
                        <span className="text-gray-900">
                          {program.submissionMethod || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Documents:</span>
                        <span className="text-gray-900">
                          {program.requiredDocuments ? program.requiredDocuments.split(',').length : 0} types
                        </span>
                      </div>
                    </div>
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
              <div className="max-w-sm mx-auto">
                <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No ESA programs match your current filters.</p>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your search criteria or clearing filters to see more results.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedState('');
                    setSelectedPortal('');
                    setFilterBackgroundCheck('');
                    setFilterInsurance('');
                    setFilterRenewal('');
                    setFilterDifficulty('');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
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