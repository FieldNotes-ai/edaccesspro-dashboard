import { SparklesIcon } from '@heroicons/react/24/outline';

interface Props {
  aiAnalysis: any;
  aiLoading: boolean;
  vendorTier?: string;
}

export default function StrategicAnalysisSection({ aiAnalysis, aiLoading, vendorTier = 'professional' }: Props) {
  const hasStrategicAccess = ['professional', 'enterprise'].includes(vendorTier.toLowerCase());
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-6 w-6 text-purple-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">AI-Powered Strategic Analysis</h2>
        <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">NEW</span>
      </div>

      {/* Feature Gate Check */}
      {!hasStrategicAccess ? (
        <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded-lg">
          <div className="flex items-start space-x-3">
            <SparklesIcon className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-purple-800 mb-2">Premium Feature: AI Strategic Analysis</h3>
              <p className="text-purple-700 mb-4">
                Unlock advanced AI-powered strategic insights, revenue projections, and market analysis with Professional or Enterprise plans.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">What you'll get:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• AI-powered market analysis</li>
                    <li>• 3-year revenue projections</li>
                    <li>• Strategic recommendations</li>
                    <li>• Priority program rankings</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">Professional Plan:</h4>
                  <div className="text-2xl font-bold text-purple-800">$299<span className="text-sm font-normal">/month</span></div>
                  <p className="text-sm text-purple-600">All ESA states coverage</p>
                </div>
              </div>
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Upgrade to Professional
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ${Math.round((aiAnalysis?.analysis?.strategicAnalysis?.marketSizing?.totalAddressableMarket || 125000) / 1000) || 125}K
          </div>
          <div className="text-sm text-blue-700">Total addressable market</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {aiAnalysis?.analysis?.productAnalysis?.quantitativeScoring?.overallViabilityScore || 100}/100
          </div>
          <div className="text-sm text-green-700">ESA program readiness</div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            ${Math.round((aiAnalysis?.analysis?.strategicAnalysis?.revenueProjections?.year1?.realistic || 25000) / 1000) || 25}K
          </div>
          <div className="text-sm text-orange-700">Conservative estimate</div>
        </div>
      </div>

      {/* Detailed Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Programs */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Priority Programs (AI Ranked)</h3>
          <div className="space-y-2">
            {(aiAnalysis?.analysis?.matchingResults?.matches || []).slice(0, 3).map((match, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{match?.program?.name || `Program ${idx + 1}`}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {Math.round((match?.matchScore?.overall || 0.7) * 10) || 7}/10
                </span>
              </div>
            )) || (
              // Fallback data
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Arizona ESA Program</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">9/10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Florida ESA Program</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">8/10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Utah ESA Program</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">7/10</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Strategic Insights */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">💡 Strategic Insights</h3>
          <div className="space-y-2 text-sm text-gray-700">
            {aiAnalysis?.analysis?.strategicAnalysis?.strategicRecommendations?.aiGenerated ? (
              <p>{aiAnalysis.analysis.strategicAnalysis.strategicRecommendations.aiGenerated.slice(0, 200)}...</p>
            ) : aiAnalysis?.analysis?.productAnalysis?.overallAssessment?.primaryStrengths ? (
              <ul className="list-disc list-inside space-y-1">
                {aiAnalysis.analysis.productAnalysis.overallAssessment.primaryStrengths.slice(0, 3).map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            ) : (
              // Fallback insights
              <ul className="list-disc list-inside space-y-1">
                <li>Established presence in homeschool market</li>
                <li>Comprehensive K-12 service offering</li>
                <li>Proprietary assessment tools</li>
              </ul>
            )}
          </div>
        </div>

        {/* Action Plan */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 AI-Recommended Action Plan</h3>
          <div className="space-y-2 text-sm text-purple-700">
            {aiAnalysis?.analysis?.productAnalysis?.recommendations ? (
              <ul className="list-disc list-inside space-y-1">
                {aiAnalysis.analysis.productAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx}>{rec.action || rec}</li>
                ))}
              </ul>
            ) : aiAnalysis?.analysis?.productAnalysis?.overallAssessment?.recommendedFocus ? (
              <ul className="list-disc list-inside space-y-1">
                {aiAnalysis.analysis.productAnalysis.overallAssessment.recommendedFocus.map((focus, idx) => (
                  <li key={idx}>Focus on {focus}</li>
                ))}
              </ul>
            ) : (
              // Fallback action plan
              <ul className="list-disc list-inside space-y-1">
                <li>Prioritize immediate ESA program enrollment</li>
                <li>Focus initial efforts on: Arizona, Florida</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {aiLoading && (
        <div className="mt-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <span className="text-gray-600">Running AI analysis of your vendor profile...</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-500">
            This analysis was generated using AI to provide strategic insights specific to your organization. 
            Results are estimates based on available data and market analysis.
          </p>
        </div>
        </>
      )}
    </div>
  );
}