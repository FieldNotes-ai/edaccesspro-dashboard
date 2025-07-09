import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import VendorOnboardingSimplified from '../components/VendorOnboardingSimplified';
import { airtableClient } from '@core/DataClient';

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding'>('landing');
  const [selectedTier, setSelectedTier] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');
  const [marketData, setMarketData] = useState({ totalMarket: 8.0, programCount: 25, studentCount: '500K+' });

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const programs = await airtableClient.get('ESA Program Tracker');
          
          // Calculate total market value dynamically
          let totalStudents = 0;
          let totalMarketValue = 0;
          
          programs.forEach((program: any) => {
            const marketSize = extractMarketSize(program);
            const annualAmount = parseAmount(program.annualAmount || '0');
            totalStudents += marketSize;
            totalMarketValue += marketSize * annualAmount;
          });
          
          setMarketData({
            totalMarket: totalMarketValue / 1000000000, // Convert to billions
            programCount: programs.length,
            studentCount: formatStudentCount(totalStudents)
          });
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    };

    fetchMarketData();
  }, []);

  const parseAmount = (amountStr: string): number => {
    if (!amountStr) return 0;
    const amounts = amountStr.match(/\$?(\d{1,3}(?:,\d{3})*)/g);
    if (amounts && amounts.length > 0) {
      const numericAmounts = amounts.map(amt => parseInt(amt.replace(/[$,]/g, '')));
      return Math.max(...numericAmounts);
    }
    return 0;
  };

  const formatStudentCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M+`;
    if (count >= 1000) return `${Math.round(count / 1000)}K+`;
    return `${count}+`;
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

  const tiers = [
    {
      id: 'free' as const,
      name: 'Free',
      price: '$0',
      description: 'Program Directory',
      features: [
        'Access to basic ESA list',
        'Portal links and contacts',
        'Program overview information',
        'State-by-state breakdown',
        'Getting started resources'
      ],
      cta: 'Start Free'
    },
    {
      id: 'starter' as const,
      name: 'Starter',
      price: '$99',
      period: '/month',
      description: 'Track up to 3 chosen states',
      features: [
        'Everything in Free',
        'Real-time policy alerts',
        'Basic reports (PDF/CSV)',
        'Email notifications',
        'State comparison tools'
      ],
      cta: 'Start 7-Day Trial',
      annual: '$990/year (save $198)'
    },
    {
      id: 'professional' as const,
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'All 18+ ESA states',
      features: [
        'Everything in Starter',
        'All ESA states coverage',
        'Unlimited team seats',
        'Advanced comparison dashboard',
        'Custom email/Slack alerts'
      ],
      cta: 'Start 7-Day Trial',
      annual: '$2,990/year (save $598)'
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: '$999',
      period: '/month',
      description: 'Full platform + API access',
      features: [
        'Everything in Professional',
        'REST API & webhooks',
        'Priority support (24h SLA)',
        '5 Application Credits/year',
        'Custom integrations'
      ],
      cta: 'Contact Sales',
      annual: '$9,990/year (save $1,998)'
    }
  ];

  if (currentView === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <VendorOnboardingSimplified userTier="professional" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">EdAccessPro</h1>
              <p className="text-lg text-gray-600 mt-1">ESA Vendor Intelligence Platform - DEMO</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                🔒 Protected Demo
              </div>
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                25 ESA Programs • 20 States
              </div>
              <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                View Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Stop Losing Revenue to ESA Program Complexity
            </h2>
            <p className="text-xl mb-10 max-w-4xl mx-auto leading-relaxed text-blue-100">
              Turn the chaotic Educational Savings Account (ESA) marketplace into your biggest revenue stream. 25+ programs, 6 different portal technologies, constantly changing requirements—we decode it all so you can focus on selling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
              >
                View Live Dashboard
              </a>
              <button
                onClick={() => {
                  setSelectedTier('professional');
                  setCurrentView('onboarding');
                }}
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-900 transition-all duration-200 border border-blue-500 shadow-lg"
              >
                Try Vendor Onboarding
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              The ${marketData.totalMarket.toFixed(1)} Billion ESA Market Is Pure Chaos... And Pure Opportunity
            </h3>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              While competitors waste months figuring out which programs accept their products, you'll know instantly. While they struggle with ClassWallet vs Odyssey integration differences, you'll be processing payments. While they guess at price parity rules, you'll be maximizing margins. This is how you turn market confusion into competitive advantage.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">${marketData.totalMarket.toFixed(1)}B+</div>
                <div className="text-gray-700">Total ESA funding allocated</div>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">{marketData.programCount}+</div>
                <div className="text-gray-700">Active ESA programs</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">{marketData.studentCount}</div>
                <div className="text-gray-700">Students eligible for ESA funds</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💸</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Missing Million-Dollar Opportunities</h4>
              <p className="text-gray-600 leading-relaxed">
                While you're researching Arizona ESA, Florida just opened 3 new programs. ClassWallet has different fee structures than Odyssey, but you're guessing instead of knowing.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⏰</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Wasting Months on Research</h4>
              <p className="text-gray-600 leading-relaxed">
                By the time you figure out renewal requirements and price parity rules, competitors have already captured market share. Time is revenue.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🚫</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Getting Rejected for Wrong Reasons</h4>
              <p className="text-gray-600 leading-relaxed">
                Your tutoring service is perfect for ESAs, but you called it "academic coaching" instead of "educational therapy" and got denied instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              See How Easy It Can Be
            </h3>
            <p className="text-xl text-gray-600">
              Watch how we turn vendor confusion into clear action plans
            </p>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-12 max-w-6xl mx-auto border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h4 className="text-2xl font-semibold text-gray-900 mb-6">You Say:</h4>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <p className="italic text-gray-700 text-lg leading-relaxed">
                    "We provide one-on-one math tutoring for struggling K-12 students and SAT prep courses."
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-2xl font-semibold text-gray-900 mb-6">We Translate To:</h4>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="space-y-3">
                    <p className="text-green-800"><strong>Arizona ESA:</strong> "Academic Support Services"</p>
                    <p className="text-green-800"><strong>Florida ESA:</strong> "Tutoring Services"</p>
                    <p className="text-green-800"><strong>Louisiana:</strong> "Educational Services - Academic Instruction"</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-300">
              <h4 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Plus Immediate Intelligence:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h5 className="text-lg font-semibold text-blue-800 mb-3">Complexity Score</h5>
                  <p className="text-blue-600">Arizona: 3/10 (Easy)</p>
                  <p className="text-blue-600">Florida: 7/10 (Complex)</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h5 className="text-lg font-semibold text-green-800 mb-3">Match Confidence</h5>
                  <p className="text-green-600">Arizona: 95% match</p>
                  <p className="text-green-600">Florida: 78% match</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h5 className="text-lg font-semibold text-purple-800 mb-3">Recommendation</h5>
                  <p className="text-purple-600">Start with Arizona ClassWallet portal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Choose Your Intelligence Level
            </h3>
            <p className="text-xl text-gray-600">
              Start free, upgrade as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`bg-white border-2 rounded-2xl p-8 relative transition-all duration-200 hover:shadow-lg ${
                  tier.id === 'professional' ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {tier.id === 'professional' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-semibold text-gray-900 mb-2">{tier.name}</h4>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    {tier.period && <span className="text-gray-600 text-lg">{tier.period}</span>}
                    {tier.annual && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        or {tier.annual}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1 text-lg">✓</span>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    setSelectedTier(tier.id);
                    setCurrentView('onboarding');
                  }}
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    tier.id === 'professional'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-On Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Add-On Services
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Take your ESA strategy to the next level with our expert services and hands-on support
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Market Entry Strategy */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200">
              <div className="text-center mb-6">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <h4 className="text-2xl font-semibold text-gray-900 mb-2">Market Entry Strategy</h4>
                <p className="text-gray-600">Custom roadmap that pinpoints your highest-ROI ESA states</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-lg font-semibold text-gray-900">Full Strategy Package</h5>
                    <span className="text-2xl font-bold text-blue-600">$3,000</span>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>AI analysis + consultant-reviewed PDF roadmap</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>1-hour live strategy call with expert</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Custom market prioritization matrix</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-lg font-semibold text-gray-900">Strategy Lite</h5>
                    <span className="text-2xl font-bold text-blue-600">$1,500</span>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Auto-generated PDF roadmap</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Market analysis and recommendations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400 mt-1">✗</span>
                      <span className="text-gray-400">No live consultation call</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Application Credits */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200">
              <div className="text-center mb-6">
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📝</span>
                </div>
                <h4 className="text-2xl font-semibold text-gray-900 mb-2">Application Credits</h4>
                <p className="text-gray-600">We prep and guide a full vendor application. Packs save up to 20%</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-lg font-semibold text-gray-900">Single Credit</h5>
                    <span className="text-2xl font-bold text-green-600">$500</span>
                  </div>
                  <p className="text-gray-600">One complete application with expert guidance</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-lg font-semibold text-gray-900">5-Credit Pack</h5>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">$2,250</span>
                      <div className="text-sm text-green-600 font-medium">Save 10%</div>
                    </div>
                  </div>
                  <p className="text-gray-600">Best for multi-state expansion</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-lg font-semibold text-gray-900">10-Credit Pack</h5>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">$4,000</span>
                      <div className="text-sm text-green-600 font-medium">Save 20%</div>
                    </div>
                  </div>
                  <p className="text-gray-600">Maximum value for enterprise expansion</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 text-lg">ℹ️</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Enterprise Plan Includes 5 Credits/Year</p>
                    <p className="text-sm text-yellow-700">Additional credits billed at list price. Credits never expire.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-lg">
            © 2025 EdAccessPro. Built for vendors, by vendors.
          </p>
        </div>
      </footer>
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