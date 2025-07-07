import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SparklesIcon } from '@heroicons/react/24/outline';
import VendorProfileSection from '../components/results/VendorProfileSection';
import ServiceAnalysisSection from '../components/results/ServiceAnalysisSection';
import CompatibilityAnalysisSection from '../components/results/CompatibilityAnalysisSection';
import StrategicAnalysisSection from '../components/results/StrategicAnalysisSection';

interface VendorData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  selectedTier: string;
  organizationType: string[];
  productServices: string;
  teamSize?: string;
  servicesUrl?: string;
  uploadedFiles?: any[];
  currentEnrollments?: string[];
  interestedStates?: string[];
  primaryGoals?: string;
  biggestChallenge?: string;
}

export default function OnboardingResults() {
  const router = useRouter();
  const { result: resultParam, vendor: vendorParam } = router.query;
  
  const [resultData, setResultData] = useState<any>(null);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [matchedPrograms, setMatchedPrograms] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  // Helper function for tier-appropriate dashboard redirects
  const getTierDashboardUrl = (tier: string) => {
    const tierParams = new URLSearchParams({
      tier: tier,
      source: 'onboarding'
    });
    
    switch (tier) {
      case 'free':
        return `/dashboard?${tierParams}&view=basic`;
      case 'starter':
        return `/dashboard?${tierParams}&view=enhanced`;
      case 'professional':
      case 'enterprise':
        return `/dashboard?${tierParams}&view=full`;
      default:
        return '/dashboard';
    }
  };

  const runAdvancedAnalysis = async (vendorDataParam = null) => {
    const dataToUse = vendorDataParam || vendorData;
    if (!dataToUse || aiLoading) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'full_analysis',
          data: dataToUse
        })
      });

      if (response.ok) {
        const analysisResult = await response.json();
        console.log('AI Analysis Result:', analysisResult);
        setAiAnalysis(analysisResult);
        setShowAdvancedAnalysis(true);
      } else {
        const errorText = await response.text();
        console.error('AI analysis failed:', response.status, response.statusText, errorText);
        alert(`Analysis failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
      alert(`Analysis error: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchMatchedPrograms = async (programAccessIds: string[]) => {
    try {
      const response = await fetch('/api/airtable?action=enhanced-programs');
      const data = await response.json();
      if (data.programs) {
        const matched = data.programs.filter((program: any) => 
          programAccessIds.includes(program.id)
        );
        setMatchedPrograms(matched);
      }
    } catch (error) {
      console.error('Error fetching matched programs:', error);
    }
  };

  useEffect(() => {
    if (resultParam && vendorParam) {
      try {
        const resultString = Array.isArray(resultParam) ? resultParam[0] : resultParam;
        const vendorString = Array.isArray(vendorParam) ? vendorParam[0] : vendorParam;
        const result = JSON.parse(decodeURIComponent(resultString));
        const vendor = JSON.parse(decodeURIComponent(vendorString));
        
        setResultData(result);
        setVendorData(vendor);
        fetchMatchedPrograms(result.programAccessIds);
        
        // Auto-run AI analysis for paid tiers
        if (vendor.selectedTier !== 'free') {
          setTimeout(() => runAdvancedAnalysis(vendor), 2000);
        }
      } catch (error) {
        console.error('Error parsing onboarding result data:', error);
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  if (!resultData || !vendorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to EdAccessPro, {vendorData.companyName}!
          </h1>
          <p className="text-gray-600">
            Your account has been created successfully. Here's your personalized ESA market analysis.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{resultData.programsGranted || 0}</div>
            <div className="text-sm text-gray-600">Programs Matched</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{vendorData.selectedTier}</div>
            <div className="text-sm text-gray-600">Service Level</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">Active</div>
            <div className="text-sm text-gray-600">Account Status</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">${Math.round((aiAnalysis?.analysis?.strategicAnalysis?.revenueProjections?.year1?.realistic || 25000) / 1000)}K</div>
            <div className="text-sm text-gray-600">Revenue Potential</div>
            <div className="text-xs text-gray-500">Realistic Year 1</div>
          </div>
        </div>

        {/* Component Sections */}
        <VendorProfileSection vendorData={vendorData} matchedPrograms={matchedPrograms} />
        
        <ServiceAnalysisSection 
          vendorData={vendorData} 
          aiAnalysis={aiAnalysis} 
          aiLoading={aiLoading} 
        />
        
        <CompatibilityAnalysisSection 
          aiAnalysis={aiAnalysis} 
        />
        
        <StrategicAnalysisSection 
          aiAnalysis={aiAnalysis} 
          aiLoading={aiLoading}
          vendorTier={vendorData.selectedTier}
        />

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => {
              // Tier-appropriate redirect
              const dashboardUrl = getTierDashboardUrl(vendorData.selectedTier);
              router.push(dashboardUrl);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View {vendorData.selectedTier === 'free' ? 'Basic' : vendorData.selectedTier === 'starter' ? 'Enhanced' : 'Full'} Dashboard
          </button>
          
          {vendorData.selectedTier !== 'free' && !aiAnalysis && !aiLoading && (
            <button
              onClick={() => runAdvancedAnalysis()}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Get AI Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}