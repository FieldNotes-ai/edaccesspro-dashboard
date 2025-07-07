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

interface Props {
  vendorData: VendorData;
  aiAnalysis: any;
  aiLoading: boolean;
}

export default function ServiceAnalysisSection({ vendorData, aiAnalysis, aiLoading }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Service Analysis</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        {/* Show AI Analysis if available */}
        {aiAnalysis?.analysis?.productAnalysis ? (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">AI-Powered Service Analysis</h4>
            <div className="bg-white p-4 rounded border-l-4 border-blue-500">
              <div className="text-sm text-gray-700">
                {typeof aiAnalysis.analysis.productAnalysis === 'string' ? (
                  <div className="whitespace-pre-wrap">{aiAnalysis.analysis.productAnalysis}</div>
                ) : (
                  <div className="space-y-4">
                    {/* Product Categories */}
                    {aiAnalysis.analysis.productAnalysis?.productCategories && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Product Categories:</h5>
                        <div className="space-y-2">
                          {(aiAnalysis.analysis.productAnalysis.productCategories || []).map((cat, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-800">{cat.category}</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  cat.esaEligibility === 'high' ? 'bg-green-100 text-green-800' :
                                  cat.esaEligibility === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {cat.esaEligibility} eligibility
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">
                                <strong>Products:</strong> {cat.products?.join(', ')}
                              </p>
                              <p className="text-xs text-gray-600 mb-1">
                                <strong>Age Ranges:</strong> {cat.ageRanges?.join(', ')}
                              </p>
                              <p className="text-xs text-gray-500 italic">{cat.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Overall Assessment */}
                    {aiAnalysis.analysis.productAnalysis?.overallAssessment && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Overall Assessment:</h5>
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-sm mb-2">
                            <strong>ESA Readiness:</strong> {aiAnalysis.analysis.productAnalysis.overallAssessment.esaReadiness}
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Viability Score:</strong> {aiAnalysis.analysis.productAnalysis.quantitativeScoring?.overallViabilityScore}/100
                          </p>
                          <div className="text-xs text-gray-600">
                            <strong>Key Strengths:</strong> {aiAnalysis.analysis.productAnalysis.overallAssessment.primaryStrengths?.slice(0, 3).join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Original input for reference */}
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">View original service description</summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                {vendorData.productServices}
              </div>
            </details>
          </div>
        ) : aiLoading ? (
          /* Loading State */
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Analyzing Your Services</h4>
            <p className="text-sm text-gray-500">Our AI is analyzing your service descriptions to provide ESA program compatibility insights...</p>
          </div>
        ) : (
          /* Fallback - Basic Analysis */
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">Basic Service Overview</h4>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-yellow-700">
                    <strong>Feature Restricted:</strong> Detailed AI analysis is available for Professional and Enterprise tiers only.
                  </p>
                  {vendorData.selectedTier === 'free' && (
                    <div className="mt-2">
                      <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700 transition-colors">
                        Upgrade to Professional
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Original input for reference */}
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">View your service description</summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                {vendorData.productServices}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Revenue Analysis */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-medium text-green-900 mb-3">💰 Revenue Potential</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">$15K</div>
            <div className="text-sm text-green-600">Conservative (Year 1)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">$25K</div>
            <div className="text-sm text-green-600">Realistic (Year 1)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-800">$45K</div>
            <div className="text-sm text-green-600">Optimistic (Year 1)</div>
          </div>
        </div>
        <p className="text-sm text-green-600 mt-4 text-center">*Based on market penetration scenarios and ESA program data</p>
      </div>
    </div>
  );
}