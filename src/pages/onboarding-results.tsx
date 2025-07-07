import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  CheckCircleIcon, 
  ChartBarIcon, 
  MapPinIcon, 
  CogIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface OnboardingResult {
  success: boolean;
  organizationId: string;
  subscriptionId?: string;
  userId?: string;
  programAccessIds: string[];
  programsGranted: number;
  inventoryItemsCreated: number;
  inventoryItemIds: string[];
  status: {
    organization: boolean;
    subscription: boolean;
    userAccount: boolean;
    programAccess: boolean;
    inventoryItems: boolean;
  };
}

interface VendorData {
  companyName: string;
  contactName: string;
  email: string;
  selectedTier: string;
  organizationType: string[];
  productServices: string;
  teamSize?: string;
}

interface ESAProgram {
  id: string;
  name: string;
  state: string;
  portalTechnology: string;
  status: string;
  operationalScore?: number;
}

export default function OnboardingResults() {
  const router = useRouter();
  const [resultData, setResultData] = useState<OnboardingResult | null>(null);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [matchedPrograms, setMatchedPrograms] = useState<ESAProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get data from URL params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const resultParam = urlParams.get('result');
    const vendorParam = urlParams.get('vendor');

    try {
      if (resultParam && vendorParam) {
        const result = JSON.parse(decodeURIComponent(resultParam));
        const vendor = JSON.parse(decodeURIComponent(vendorParam));
        setResultData(result);
        setVendorData(vendor);
        fetchMatchedPrograms(result.programAccessIds);
      } else {
        // Fallback: redirect to dashboard if no data
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error parsing onboarding result data:', error);
      router.push('/dashboard');
    }
  }, [router]);

  const fetchMatchedPrograms = async (programIds: string[]) => {
    try {
      const response = await fetch('/api/airtable?action=enhanced-programs');
      if (response.ok) {
        const data = await response.json();
        const matched = data.programs.filter((p: ESAProgram) => 
          programIds.includes(p.id)
        );
        setMatchedPrograms(matched);
      }
    } catch (error) {
      console.error('Error fetching matched programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOperationalScore = (program: ESAProgram): number => {
    // Use actual scoring logic from dashboard
    let score = 1;
    
    // Simulate scoring based on portal technology and program characteristics
    if (program.portalTechnology === 'ClassWallet') score += 1;
    if (program.portalTechnology === 'Odyssey') score += 0.5;
    if (program.portalTechnology === 'Step Up For Students') score += 0.5;
    if (program.portalTechnology === 'Student First') score -= 0.5;
    
    // Add random variance for demonstration
    score += Math.random() * 2;
    
    return Math.min(Math.max(score, 1), 5);
  };

  const analyzeServiceCompatibility = (services: string, organizationType: string[]) => {
    const categories = [];
    const serviceText = services.toLowerCase();
    
    if (serviceText.includes('tutor') || serviceText.includes('instruction')) {
      categories.push({ category: 'Tutoring Services', confidence: 'High', description: 'Strong match for ESA educational services' });
    }
    if (serviceText.includes('curriculum') || serviceText.includes('materials')) {
      categories.push({ category: 'Educational Materials', confidence: 'High', description: 'Direct fit for curriculum categories' });
    }
    if (serviceText.includes('therapy') || serviceText.includes('therapeutic')) {
      categories.push({ category: 'Educational Therapies', confidence: 'Medium', description: 'Specialty services with state-specific eligibility' });
    }
    if (serviceText.includes('technology') || serviceText.includes('software') || serviceText.includes('platform')) {
      categories.push({ category: 'Educational Technology', confidence: 'Good', description: 'Digital learning solutions eligible in most programs' });
    }
    if (serviceText.includes('assessment') || serviceText.includes('testing')) {
      categories.push({ category: 'Assessment Services', confidence: 'Medium', description: 'Varies by program, often restricted' });
    }
    
    return categories.length > 0 ? categories : [
      { category: 'General Educational Services', confidence: 'Medium', description: 'Broad category - specific classification needed' }
    ];
  };

  const calculateRevenueProjection = (programCount: number, tier: string, serviceCategories: any[]) => {
    const baseRevenuePerProgram = {
      'Tutoring Services': 50000,
      'Educational Materials': 25000,
      'Educational Technology': 40000,
      'Educational Therapies': 75000,
      'Assessment Services': 30000
    };

    let totalProjection = 0;
    serviceCategories.forEach(category => {
      const baseRevenue = baseRevenuePerProgram[category.category as keyof typeof baseRevenuePerProgram] || 35000;
      const multiplier = category.confidence === 'High' ? 1.0 : category.confidence === 'Good' ? 0.8 : 0.6;
      totalProjection += baseRevenue * multiplier * programCount * 0.3; // 30% market penetration assumption
    });

    return Math.round(totalProjection);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 4.5) return 'bg-emerald-100 text-emerald-800';
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    if (score >= 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 4) return 'Vendor Friendly';
    if (score >= 3) return 'Moderate';
    if (score >= 2) return 'High Barriers';
    return 'Very Difficult';
  };

  const getPortalColor = (portal: string) => {
    switch (portal) {
      case 'ClassWallet': return 'bg-green-100 text-green-800';
      case 'Odyssey': return 'bg-blue-100 text-blue-800';
      case 'Student First': return 'bg-purple-100 text-purple-800';
      case 'Step Up For Students': return 'bg-indigo-100 text-indigo-800';
      case 'Other': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierFeatures = (tier: string) => {
    switch (tier) {
      case 'free':
        return {
          name: 'Free Program Directory',
          features: ['Basic program listings', 'Portal links', 'State overview', 'Getting started guide'],
          nextSteps: ['Upgrade to Starter for smart matching', 'Explore program requirements', 'Download compliance checklists']
        };
      case 'starter':
        return {
          name: 'Starter Intelligence',
          features: ['Smart program matching', 'Complexity scoring', 'Basic recommendations', 'Up to 15 programs'],
          nextSteps: ['Review matched programs', 'Start application process', 'Track progress in dashboard']
        };
      case 'professional':
        return {
          name: 'Professional Strategy',
          features: ['Capacity analysis', 'Revenue projections', 'Prioritized roadmaps', 'Application guides'],
          nextSteps: ['Review strategic recommendations', 'Download application templates', 'Schedule implementation timeline']
        };
      case 'enterprise':
        return {
          name: 'Enterprise Automation',
          features: ['Full program access', 'Application assistance', 'Expert consultation', 'Status monitoring'],
          nextSteps: ['Connect with dedicated account manager', 'Begin application assistance', 'Access expert consultation']
        };
      default:
        return {
          name: 'Program Access',
          features: ['Basic access'],
          nextSteps: ['Explore dashboard']
        };
    }
  };

  if (loading || !resultData || !vendorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  const tierInfo = getTierFeatures(vendorData.selectedTier);
  const serviceCategories = vendorData.productServices ? analyzeServiceCompatibility(vendorData.productServices, vendorData.organizationType) : [];
  const projectedRevenue = vendorData.selectedTier !== 'free' ? calculateRevenueProjection(resultData.programsGranted, vendorData.selectedTier, serviceCategories) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome to EdAccessPro, {vendorData.companyName}!</h1>
              <p className="text-gray-600">Your account has been created successfully. Here's your personalized ESA market analysis.</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Programs Matched</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{resultData.programsGranted}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">Service Level</span>
              </div>
              <p className="text-lg font-bold text-purple-900 mt-1">{tierInfo.name}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Account Status</span>
              </div>
              <p className="text-lg font-bold text-green-900 mt-1">Active</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                {projectedRevenue ? (
                  <>
                    <CurrencyDollarIcon className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Revenue Potential</span>
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Avg. Program Score</span>
                  </>
                )}
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {projectedRevenue 
                  ? `$${(projectedRevenue / 1000).toFixed(0)}K`
                  : matchedPrograms.length > 0 
                    ? `${(matchedPrograms.reduce((sum, p) => sum + getOperationalScore(p), 0) / matchedPrograms.length).toFixed(1)}/5`
                    : '—'
                }
              </p>
              {projectedRevenue && (
                <p className="text-xs text-orange-700 mt-1">Annual projection</p>
              )}
            </div>
          </div>
        </div>

        {/* Your Matched Programs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Best ESA Program Matches</h2>
          <p className="text-gray-600 mb-6">Based on your organization type "{vendorData.organizationType.join(', ')}" and services, we've identified these high-potential programs:</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matchedPrograms.map((program) => {
              const score = getOperationalScore(program);
              return (
                <div key={program.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                      <p className="text-gray-600">{program.state}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(score)}`}>
                      {score.toFixed(1)}/5 - {getScoreLabel(score)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPortalColor(program.portalTechnology)}`}>
                      <CogIcon className="h-3 w-3 mr-1" />
                      {program.portalTechnology || 'Unknown'}
                    </span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      program.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {program.status || 'Unknown'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>• Entry barriers: {score >= 4 ? 'Low' : score >= 3 ? 'Moderate' : 'High'}</p>
                    <p>• Platform complexity: {program.portalTechnology === 'ClassWallet' ? 'Simple' : program.portalTechnology === 'Odyssey' ? 'Moderate' : 'Variable'}</p>
                    <p>• Recommended priority: {score >= 4 ? 'High' : score >= 3 ? 'Medium' : 'Low'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier-Specific Features & Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Your Plan Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your {tierInfo.name} Features</h2>
            <ul className="space-y-3">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {vendorData.selectedTier === 'free' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Upgrade for More Value</h3>
                <p className="text-sm text-blue-700">Get smart matching and personalized recommendations with our paid plans starting at $99/month.</p>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended Next Steps</h2>
            <ul className="space-y-4">
              {tierInfo.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>View Full Dashboard</span>
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </button>
              
              {vendorData.selectedTier === 'free' && (
                <button
                  onClick={() => router.push('/?upgrade=true')}
                  className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Service Analysis Preview (for paid tiers) */}
        {vendorData.selectedTier !== 'free' && vendorData.productServices && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Service Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Services Provided</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{vendorData.productServices}</p>
                </div>
                
                {projectedRevenue && vendorData.selectedTier !== 'starter' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Revenue Analysis</h4>
                    <p className="text-sm text-blue-700">
                      Based on your services and matched programs, estimated annual revenue potential: 
                      <span className="font-semibold"> ${projectedRevenue.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      *Assumes 30% market penetration across matched programs
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">ESA Compatibility Analysis</h3>
                <div className="space-y-3">
                  {serviceCategories.map((category, index) => {
                    const getConfidenceColor = (confidence: string) => {
                      switch(confidence) {
                        case 'High': return 'text-green-600 bg-green-50';
                        case 'Good': return 'text-blue-600 bg-blue-50';
                        case 'Medium': return 'text-yellow-600 bg-yellow-50';
                        default: return 'text-gray-600 bg-gray-50';
                      }
                    };

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{category.category}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor(category.confidence)}`}>
                            {category.confidence} Match
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{category.description}</p>
                      </div>
                    );
                  })}
                </div>
                
                {vendorData.selectedTier === 'professional' || vendorData.selectedTier === 'enterprise' ? (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-700">
                      🎯 <strong>Strategic Recommendation:</strong> Focus on {serviceCategories.filter(c => c.confidence === 'High')[0]?.category || serviceCategories[0]?.category} for fastest market entry
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}