import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { ChevronRightIcon, CheckCircleIcon, ExclamationTriangleIcon, DocumentArrowUpIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface ESAProgram {
  id: string;
  name: string;
  state: string;
  portalTechnology: string;
}

const ORGANIZATION_TYPES = [
  'Educational Services Provider',
  'Curriculum & Content Publisher',
  'Assessment & Testing Service',
  'Homeschool Resource Company',
  'Other Educational Vendor'
];

// ESA programs will be loaded dynamically from API

interface VendorOnboardingProps {
  userTier: 'free' | 'starter' | 'professional' | 'enterprise';
}

export default function VendorOnboardingSimplified({ userTier }: VendorOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [esaPrograms, setEsaPrograms] = useState<ESAProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active ESA programs on component mount
  React.useEffect(() => {
    const loadEsaPrograms = async () => {
      try {
        const { airtableClient } = await import('@core/DataClient');
        const programs = await airtableClient.get('ESA Program Tracker');
        if (programs) {
            setEsaPrograms(programs.map((p: any) => ({
              id: p.id,
              name: p.name,
              state: p.state,
              portalTechnology: p.portalTechnology || 'Unknown'
            })));
          }
      } catch (error) {
        console.error('Failed to load ESA programs:', error);
        setSubmitError('Failed to load ESA programs. Please refresh the page.');
      } finally {
        setProgramsLoading(false);
      }
    };
    loadEsaPrograms();
  }, []);

  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    phone: '',
    teamSize: '',
    organizationTypes: [] as string[],
    servicesUrl: '',
    productServices: '',
    uploadedFiles: [] as File[],
    currentEnrollments: [] as string[],
    interestedStates: [] as string[],
    primaryGoals: [] as string[],
    biggestChallenge: ''
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { airtableClient } = await import('@core/DataClient');
      const orgResult = await airtableClient.insert('Organizations', formData);
      
      if (orgResult) {
        setSubmitSuccess(true);
        
        // Prepare data for results page
        const vendorData = {
          companyName: formData.organizationName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          selectedTier: 'professional',
          organizationType: formData.organizationTypes,
          productServices: formData.productServices,
          teamSize: formData.teamSize,
          servicesUrl: formData.servicesUrl,
          uploadedFiles: formData.uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
          currentEnrollments: formData.currentEnrollments,
          interestedStates: formData.interestedStates,
          primaryGoals: formData.primaryGoals,
          biggestChallenge: formData.biggestChallenge
        };

        // Redirect to results page with data
        const resultParam = encodeURIComponent(JSON.stringify({ success: true }));
        const vendorParam = encodeURIComponent(JSON.stringify(vendorData));
        router.push(`/onboarding-results?result=${resultParam}&vendor=${vendorParam}`);
      } else {
        setSubmitError('Failed to create organization. Please try again.');
      }
      
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to EdAccessPro</h2>
        <p className="text-gray-600 mb-8">Let's get you set up to find the best ESA opportunities for your organization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            value={formData.organizationName}
            onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
            placeholder="Your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Contact</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            value={formData.contactName}
            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
          <input
            type="tel"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
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
          <label className="block text-sm font-medium text-gray-700 mb-3">Organization Type(s) <span className="text-gray-500">(Select all that apply)</span></label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ORGANIZATION_TYPES.map((type) => (
              <label key={type} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
                <input
                  type="checkbox"
                  checked={formData.organizationTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        organizationTypes: [...prev.organizationTypes, type]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        organizationTypes: prev.organizationTypes.filter(t => t !== type)
                      }));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 leading-tight">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Services Description with Multiple Options */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">Tell us about your products & services</label>
          
          {/* Option 1: Website URL */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <GlobeAltIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Website URL (Recommended)</span>
            </div>
            <input
              type="url"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              value={formData.servicesUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, servicesUrl: e.target.value }))}
              placeholder="https://yourcompany.com/services"
            />
            <p className="text-xs text-gray-500 mt-1">We'll analyze your website to understand your services</p>
          </div>

          {/* Option 2: File Upload */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Upload Documents (Optional)</span>
            </div>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Service catalogs, brochures, pricing sheets (PDF, DOC, XLS)</p>
              </div>
              {formData.uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-600">{formData.uploadedFiles.length} file(s) uploaded</p>
                  <div className="text-xs text-gray-500">
                    {formData.uploadedFiles.map(file => file.name).join(', ')}
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setFormData(prev => ({ ...prev, uploadedFiles: files }));
              }}
            />
          </div>

          {/* Option 3: Text Description */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Or describe your services</span>
            </div>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              value={formData.productServices}
              onChange={(e) => setFormData(prev => ({ ...prev, productServices: e.target.value }))}
              placeholder="E.g., We provide 1-on-1 math tutoring for K-12 students, SAT prep courses, and educational consulting for homeschool families..."
            />
            <p className="text-xs text-gray-500 mt-1">We'll translate your description to match ESA program terminology</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgramSelection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ESA Experience & Goals</h2>
        <p className="text-gray-600 mb-8">Help us understand your ESA experience and which opportunities interest you most.</p>
      </div>

      {/* Primary Goals */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">What are your primary goals? <span className="text-gray-500">(Select all that apply)</span></label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Enter new ESA markets',
            'Improve existing program performance', 
            'Understand compliance requirements',
            'Increase revenue from ESA programs',
            'Streamline application processes',
            'Find programs that fit my services',
            'Get help with vendor applications',
            'Monitor policy changes'
          ].map((goal) => (
            <label key={goal} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
              <input
                type="checkbox"
                checked={formData.primaryGoals.includes(goal)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      primaryGoals: [...prev.primaryGoals, goal]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      primaryGoals: prev.primaryGoals.filter(g => g !== goal)
                    }));
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{goal}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Current Enrollments - Live ESA Programs */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Which ESA programs are you currently enrolled in? <span className="text-gray-500">(Check all that apply)</span></label>
        
        {programsLoading ? (
          <div className="border border-gray-200 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading active ESA programs...</p>
          </div>
        ) : esaPrograms.length === 0 ? (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <p className="text-red-700">Failed to load ESA programs. Please refresh the page.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
            {/* Group programs by state and sort alphabetically */}
            {Array.from(new Set(esaPrograms.map(p => p.state)))
              .sort()
              .map((state) => {
                const statePrograms = esaPrograms.filter(p => p.state === state).sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <div key={state} className="border-b border-gray-100 last:border-b-0">
                    {/* State Header */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                        {state}
                        <span className="text-xs text-gray-500 font-normal">
                          {statePrograms.length} program{statePrograms.length !== 1 ? 's' : ''}
                        </span>
                      </h4>
                    </div>
                    
                    {/* Programs for this state */}
                    <div className="p-2">
                      {statePrograms.map((program) => (
                        <label key={program.id} className="flex items-start space-x-3 p-3 hover:bg-blue-50 rounded cursor-pointer transition-colors duration-150">
                          <input
                            type="checkbox"
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
                            <div className="text-sm font-medium text-gray-900 leading-tight">{program.name}</div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{program.portalTechnology}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
        
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {formData.currentEnrollments.length === 0 
              ? "No current enrollments? No problem! We'll help you find the best programs to start with."
              : `${formData.currentEnrollments.length} program(s) selected`
            }
          </p>
          {!programsLoading && (
            <p className="text-xs text-blue-600">
              Showing {esaPrograms.length} active ESA programs
            </p>
          )}
        </div>
      </div>

      {/* Interested States - Based on Live ESA Programs */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">Which states are you most interested in? <span className="text-gray-500">(Select up to 5)</span></label>
        
        {programsLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading states...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Array.from(new Set(esaPrograms.map(p => p.state))).sort().map((state) => {
                const statePrograms = esaPrograms.filter(p => p.state === state);
                return (
                  <label key={state} className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={formData.interestedStates.includes(state)}
                      onChange={(e) => {
                        if (e.target.checked && formData.interestedStates.length < 5) {
                          setFormData(prev => ({
                            ...prev,
                            interestedStates: [...prev.interestedStates, state]
                          }));
                        } else if (!e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            interestedStates: prev.interestedStates.filter(s => s !== state)
                          }));
                        }
                      }}
                      disabled={!formData.interestedStates.includes(state) && formData.interestedStates.length >= 5}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div>
                      <span className="text-sm text-gray-700">{state}</span>
                      {statePrograms.length > 1 && (
                        <span className="text-xs text-blue-600 ml-1">({statePrograms.length})</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.interestedStates.length}/5 states selected
              {!programsLoading && ` • ${Array.from(new Set(esaPrograms.map(p => p.state))).length} states available`}
            </p>
          </>
        )}
      </div>

      {/* Quick Challenge Assessment */}
      {formData.currentEnrollments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Experience Check</h3>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">What's your biggest challenge with ESA programs?</label>
            <select
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={formData.biggestChallenge}
              onChange={(e) => setFormData(prev => ({ ...prev, biggestChallenge: e.target.value }))}
            >
              <option value="">Select your biggest challenge</option>
              <option value="Payment delays">Payment delays</option>
              <option value="Application complexity">Application complexity</option>
              <option value="Unclear requirements">Unclear requirements</option>
              <option value="Portal/technology issues">Portal/technology issues</option>
              <option value="Communication with programs">Communication with programs</option>
              <option value="Documentation burden">Too much paperwork</option>
              <option value="Student enrollment">Student enrollment process</option>
              <option value="No major issues">No major issues - looking to expand</option>
            </select>
          </div>
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
      
      <div className="flex items-center space-x-4">
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
        <div className="text-sm text-gray-500">
          Step {currentStep} of 2: {currentStep === 1 ? 'Organization Details' : 'ESA Experience & Goals'}
        </div>
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
        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>
          {isSubmitting ? 'Creating Account...' : (currentStep === 2 ? 'Complete Setup' : 'Next')}
        </span>
        {!isSubmitting && <ChevronRightIcon className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">EdAccessPro</h1>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
            {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier
          </div>
        </div>
        <div className="bg-gray-100 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%` }}
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
      {currentStep === 2 && renderProgramSelection()}

      {renderStepNavigation()}
    </div>
  );
}