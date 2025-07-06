import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import VendorOnboarding from '../components/VendorOnboarding';

export default function Demo() {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding'>('landing');
  const [selectedTier, setSelectedTier] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');

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
              🎉 Welcome to the EdAccessPro Demo!
            </h2>
            <p className="text-xl mb-10 max-w-4xl mx-auto leading-relaxed text-blue-100">
              You're viewing our password-protected demo environment. Explore our vendor intelligence platform for ESA programs.
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

      {/* Demo Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              What You Can Demo Today
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Live Dashboard</h4>
              <p className="text-gray-600 leading-relaxed mb-4">
                Browse 25 real ESA programs with live portal links and vendor intelligence.
              </p>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                View Dashboard →
              </a>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Vendor Onboarding</h4>
              <p className="text-gray-600 leading-relaxed mb-4">
                See how vendors sign up and get matched to relevant ESA programs.
              </p>
              <button 
                onClick={() => setCurrentView('onboarding')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Try Onboarding →
              </button>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💡</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Smart Intelligence</h4>
              <p className="text-gray-600 leading-relaxed mb-4">
                Experience how we translate vendor services into ESA-compatible language.
              </p>
              <span className="text-gray-500 font-medium">Integrated Throughout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-lg">
            🔒 EdAccessPro Demo Environment - Password: hewitt2025
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