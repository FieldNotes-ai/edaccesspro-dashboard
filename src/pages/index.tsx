import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import VendorOnboarding from '../components/VendorOnboarding';

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding'>('landing');
  const [selectedTier, setSelectedTier] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for authentication cookie safely
    const checkAuth = () => {
      try {
        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return null;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const authCookie = getCookie('demo-auth');
        if (authCookie === 'authenticated') {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tiers = [
    {
      id: 'free' as const,
      name: 'Free',
      price: '$0',
      description: 'Basic program directory',
      features: [
        'Access to 25 ESA programs',
        'Basic program information',
        'Portal links and contacts',
        'Pain point identification',
        'Solution previews (upgrade to unlock)'
      ],
      cta: 'Start Free'
    },
    {
      id: 'starter' as const,
      name: 'Starter',
      price: '$99',
      period: '/month',
      description: 'Smart matching and basic solutions',
      features: [
        'Everything in Free',
        'Smart product/service matching',
        'Registration complexity scoring',
        'Basic pain point solutions',
        'Email support'
      ],
      cta: 'Start 7-Day Trial'
    },
    {
      id: 'professional' as const,
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'Full intelligence and strategy',
      features: [
        'Everything in Starter',
        'Capacity analysis and recommendations',
        'Advanced compliance intelligence',
        'Vendor experience comparisons',
        'Priority support'
      ],
      cta: 'Start 7-Day Trial'
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: '$999',
      period: '/month',
      description: 'Custom solutions and consultation',
      features: [
        'Everything in Professional',
        'Custom vendor success tracking',
        'Direct program advocacy',
        'Expert consultation calls',
        'Custom integrations'
      ],
      cta: 'Contact Sales'
    }
  ];

  if (currentView === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <VendorOnboarding userTier={selectedTier} />
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
              <p className="text-lg text-gray-600 mt-1">ESA Vendor Intelligence Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Live Data
              </div>
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                25 ESA Programs • 20 States
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Stop Guessing.<br/>
              Start Winning ESA Applications.
            </h2>
            <p className="text-xl mb-10 max-w-4xl mx-auto leading-relaxed text-blue-100">
              The only platform that translates your products into ESA-compatible language, 
              identifies the best programs for your capacity, and solves your current enrollment pain points.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSelectedTier('free');
                  setCurrentView('onboarding');
                }}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
              >
                Try Free Demo
              </button>
              <button
                onClick={() => {
                  setSelectedTier('professional');
                  setCurrentView('onboarding');
                }}
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-900 transition-all duration-200 border border-blue-500 shadow-lg"
              >
                Start Professional Trial
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
              ESA Programs Are Confusing. We Make Them Simple.
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every vendor faces the same challenges when navigating ESA programs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">😵</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Every Program is Different</h4>
              <p className="text-gray-600 leading-relaxed">
                25 ESA programs across 20 states, each with unique terminology, requirements, and portal technologies.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⏰</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Requirements Keep Changing</h4>
              <p className="text-gray-600 leading-relaxed">
                Programs update requirements without notice, and what worked last month might not work today.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤔</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Your Products Don't "Fit"</h4>
              <p className="text-gray-600 leading-relaxed">
                You describe "math tutoring" but programs want "academic support services" - and you don't know the difference.
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