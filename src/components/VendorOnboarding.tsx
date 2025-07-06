import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PainPoint {
  id: string;
  label: string;
  description: string;
  commonSolution?: string;
}

interface ESAProgram {
  id: string;
  name: string;
  state: string;
  portalTechnology: string;
}

const PAIN_POINTS: PainPoint[] = [
  {
    id: 'payment_delays',
    label: 'Payment delays',
    description: 'Slow reimbursements or processing',
    commonSolution: 'Average delay is 15-30 days. Consider programs with ACH processing.'
  },
  {
    id: 'application_complexity',
    label: 'Application process complexity',
    description: 'Confusing forms or requirements',
    commonSolution: 'Use our step-by-step guides. ClassWallet programs are typically simpler.'
  },
  {
    id: 'communication_issues',
    label: 'Communication issues with program staff',
    description: 'Unresponsive or unclear communication',
    commonSolution: 'We maintain direct contacts for 85% of programs.'
  },
  {
    id: 'portal_problems',
    label: 'Portal/technology problems',
    description: 'Website issues or system bugs',
    commonSolution: 'Consider alternative programs with better technology infrastructure.'
  },
  {
    id: 'unclear_requirements',
    label: 'Unclear requirements',
    description: 'Confusing or changing eligibility rules',
    commonSolution: 'Our compliance intelligence tracks requirement changes in real-time.'
  },
  {
    id: 'documentation_burden',
    label: 'Documentation burdens',
    description: 'Too much paperwork or reporting',
    commonSolution: 'We can automate 60% of standard documentation requirements.'
  },
  {
    id: 'student_enrollment',
    label: 'Student enrollment process',
    description: 'Difficult for families to enroll',
    commonSolution: 'Consider programs with simplified family onboarding.'
  },
  {
    id: 'reporting_requirements',
    label: 'Reporting requirements',
    description: 'Complex or frequent reporting needs',
    commonSolution: 'Our automation can handle monthly reports for most programs.'
  }
];

const SAMPLE_PROGRAMS: ESAProgram[] = [
  { id: '1', name: 'Arizona ESA', state: 'Arizona', portalTechnology: 'ClassWallet' },
  { id: '2', name: 'Florida ESA', state: 'Florida', portalTechnology: 'Custom Portal' },
  { id: '3', name: 'Louisiana LA GATOR', state: 'Louisiana', portalTechnology: 'Odyssey' },
  { id: '4', name: 'Wyoming Steamboat Legacy', state: 'Wyoming', portalTechnology: 'Odyssey' },
  { id: '5', name: 'Alabama CHOOSE Act', state: 'Alabama', portalTechnology: 'ClassWallet' }
];

interface VendorOnboardingProps {
  userTier: 'free' | 'starter' | 'professional' | 'enterprise';
}

export default function VendorOnboarding({ userTier }: VendorOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    teamSize: '',
    organizationType: '',
    productServices: '',
    currentEnrollments: [] as string[],
    painPoints: {} as Record<string, { selected: boolean; impact: string; attempted: string }>,
    geographicFocus: '',
    revenueGoals: '',
    riskTolerance: ''
  });

  const handlePainPointChange = (painPointId: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      painPoints: {
        ...prev.painPoints,
        [painPointId]: {
          ...prev.painPoints[painPointId],
          [field]: value
        }
      }
    }));
  };

  const getTierFeatures = () => {
    switch (userTier) {
      case 'free':
        return {
          painPointDetails: false,
          solutions: false,
          solutionPreviews: true,
          advancedMatching: false
        };
      case 'starter':
        return {
          painPointDetails: true,
          solutions: true,
          solutionPreviews: true,
          advancedMatching: false
        };
      case 'professional':
        return {
          painPointDetails: true,
          solutions: true,
          solutionPreviews: true,
          advancedMatching: true
        };
      case 'enterprise':
        return {
          painPointDetails: true,
          solutions: true,
          solutionPreviews: true,
          advancedMatching: true
        };
      default:
        return {
          painPointDetails: false,
          solutions: false,
          solutionPreviews: false,
          advancedMatching: false
        };
    }
  };

  const features = getTierFeatures();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/airtable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_vendor',
          data: {
            companyName: formData.organizationName,
            contactName: formData.contactName,
            email: formData.email,
            selectedTier: userTier,
            organizationType: formData.organizationType ? [formData.organizationType] : [],
            teamSize: formData.teamSize,
            products: formData.productServices ? [formData.productServices] : [],
            painPoints: formData.painPoints,
            geographicFocus: formData.geographicFocus,
            revenueGoals: formData.revenueGoals,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create vendor profile');
      }

      const result = await response.json();
      setSubmitSuccess(true);
      console.log('Vendor created successfully:', result);
      
    } catch (error) {
      console.error('Error creating vendor:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create vendor profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Inter', letterSpacing: '-0.02em'}}>Welcome to EdAccessPro</h2>
        <p className="text-gray-600 mb-8" style={{fontFamily: 'Inter'}}>Let's get you set up to find the best ESA opportunities for your organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Inter', fontSize: '0.875rem'}}>Organization Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            style={{fontFamily: 'Inter', fontSize: '0.875rem', backgroundColor: '#ffffff'}}
            value={formData.organizationName}
            onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
            placeholder="Your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Inter', fontSize: '0.875rem'}}>Primary Contact</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            style={{fontFamily: 'Inter', fontSize: '0.875rem', backgroundColor: '#ffffff'}}
            value={formData.contactName}
            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Inter', fontSize: '0.875rem'}}>Email</label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            style={{fontFamily: 'Inter', fontSize: '0.875rem', backgroundColor: '#ffffff'}}
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Inter', fontSize: '0.875rem'}}>Team Size</label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            style={{fontFamily: 'Inter', fontSize: '0.875rem', backgroundColor: '#ffffff'}}
            value={formData.teamSize}
            onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
          >
            <option value="">Select team size</option>
            <option value="1-2">1-2 people (Micro)</option>
            <option value="3-10">3-10 people (Small)</option>
            <option value="11-50">11-50 people (Medium)</option>
            <option value="50+">50+ people (Enterprise)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Inter', fontSize: '0.875rem'}}>Organization Type</label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            style={{fontFamily: 'Inter', fontSize: '0.875rem', backgroundColor: '#ffffff'}}
            value={formData.organizationType}
            onChange={(e) => setFormData(prev => ({ ...prev, organizationType: e.target.value }))}
          >
            <option value="">Select organization type</option>
            <option value="Educational Service Provider">Educational Service Provider</option>
            <option value="Nonprofit">Nonprofit</option>
            <option value="For-Profit Company">For-Profit Company</option>
            <option value="Educational Institution">Educational Institution</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Inter', fontSize: '0.875rem'}}>
            Products & Services 
            <span className="text-sm text-gray-500 ml-2" style={{fontFamily: 'Inter'}}>(Describe in your own words - we'll translate to ESA terminology)</span>
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            style={{fontFamily: 'Inter', fontSize: '0.875rem', backgroundColor: '#ffffff', lineHeight: '1.6'}}
            value={formData.productServices}
            onChange={(e) => setFormData(prev => ({ ...prev, productServices: e.target.value }))}
            placeholder="E.g., We provide 1-on-1 math tutoring for K-12 students, SAT prep courses, and educational consulting for homeschool families..."
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentEnrollments = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Inter', letterSpacing: '-0.02em'}}>Current ESA Enrollments</h2>
        <p className="text-gray-600 mb-8" style={{fontFamily: 'Inter'}}>Tell us which ESA programs you're currently enrolled in so we can help optimize your experience.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-4">Select programs you're currently enrolled in:</label>
        
        {SAMPLE_PROGRAMS.map((program) => (
          <div key={program.id} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all duration-200" style={{backgroundColor: '#ffffff'}}>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={program.id}
                checked={formData.currentEnrollments.includes(program.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      currentEnrollments: [...prev.currentEnrollments, program.id]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      currentEnrollments: prev.currentEnrollments.filter(id => id !== program.id)
                    }));
                  }
                }}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor={program.id} className="text-sm font-medium text-gray-900 cursor-pointer" style={{fontFamily: 'Inter', fontSize: '1rem'}}>
                  {program.name}
                </label>
                <p className="text-sm text-gray-500" style={{fontFamily: 'Inter'}}>{program.state} • {program.portalTechnology}</p>
              </div>
            </div>

            {formData.currentEnrollments.includes(program.id) && (
              <div className="mt-4 pl-7 space-y-4 border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-900">Tell us about your experience:</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What pain points are you experiencing?</label>
                  <div className="space-y-2">
                    {PAIN_POINTS.map((painPoint) => (
                      <div key={painPoint.id} className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`${program.id}-${painPoint.id}`}
                          checked={formData.painPoints[`${program.id}-${painPoint.id}`]?.selected || false}
                          onChange={(e) => handlePainPointChange(`${program.id}-${painPoint.id}`, 'selected', e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor={`${program.id}-${painPoint.id}`} className="text-sm text-gray-700 cursor-pointer">
                            {painPoint.label}
                          </label>
                          <p className="text-xs text-gray-500">{painPoint.description}</p>
                          
                          {formData.painPoints[`${program.id}-${painPoint.id}`]?.selected && (
                            <div className="mt-2 space-y-2">
                              {features.painPointDetails && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Impact Level</label>
                                  <select
                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formData.painPoints[`${program.id}-${painPoint.id}`]?.impact || ''}
                                    onChange={(e) => handlePainPointChange(`${program.id}-${painPoint.id}`, 'impact', e.target.value)}
                                  >
                                    <option value="">Select impact</option>
                                    <option value="minor">Minor annoyance</option>
                                    <option value="time-consuming">Time-consuming</option>
                                    <option value="revenue-affecting">Revenue-affecting</option>
                                    <option value="critical">Critical issue</option>
                                  </select>
                                </div>
                              )}
                              
                              {features.painPointDetails && userTier !== 'free' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    What have you tried? <span className="text-gray-400">(optional)</span>
                                  </label>
                                  <textarea
                                    rows={2}
                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formData.painPoints[`${program.id}-${painPoint.id}`]?.attempted || ''}
                                    onChange={(e) => handlePainPointChange(`${program.id}-${painPoint.id}`, 'attempted', e.target.value)}
                                    placeholder="Brief description of solutions you've attempted..."
                                  />
                                </div>
                              )}

                              {features.solutions && painPoint.commonSolution && (
                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                  <div className="flex items-start space-x-2">
                                    <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-green-800">Recommended Solution:</p>
                                      <p className="text-xs text-green-700">{painPoint.commonSolution}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {features.solutionPreviews && !features.solutions && painPoint.commonSolution && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <div className="flex items-start space-x-2">
                                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-yellow-800">Solution Available</p>
                                      <p className="text-xs text-yellow-700">Upgrade to see our recommended solutions for this issue.</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {formData.currentEnrollments.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No current enrollments? No problem! We'll help you find the best programs to start with.</p>
        </div>
      )}
    </div>
  );

  const renderStepNavigation = () => (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      <button
        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
        disabled={currentStep === 1}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      <div className="flex space-x-2">
        {[1, 2].map((step) => (
          <div
            key={step}
            className={`w-3 h-3 rounded-full ${
              step === currentStep ? 'bg-blue-600' : step < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => {
          if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
          } else {
            handleSubmit();
          }
        }}
        disabled={isSubmitting}
        className="flex items-center space-x-2 px-6 py-3 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{backgroundColor: '#2563eb', fontFamily: 'Inter', fontSize: '0.875rem', fontWeight: '500'}}
      >
        <span>
          {isSubmitting ? 'Creating Account...' : (currentStep === 2 ? 'Complete Setup' : 'Next')}
        </span>
        {!isSubmitting && <ChevronRightIcon className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg" style={{fontFamily: 'Inter'}}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Inter', fontSize: '2.25rem', fontWeight: '700', letterSpacing: '-0.02em'}}>EdAccessPro</h1>
          <div className="px-4 py-2 rounded-lg text-sm font-medium" style={{backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontFamily: 'Inter'}}>
            {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier
          </div>
        </div>
        <div className="bg-gray-100 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%`, backgroundColor: '#2563eb' }}
          />
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <h3 className="text-green-800 font-semibold">Welcome to EdAccessPro!</h3>
              <p className="text-green-700">Your vendor profile has been created successfully. You now have access to our {userTier} tier features.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-red-800 font-semibold">Error Creating Profile</h3>
              <p className="text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && renderBasicInfo()}
      {currentStep === 2 && renderCurrentEnrollments()}

      {renderStepNavigation()}
    </div>
  );
}