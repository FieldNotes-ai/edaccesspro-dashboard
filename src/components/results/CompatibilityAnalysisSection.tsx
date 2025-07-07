interface Props {
  aiAnalysis: any;
}

export default function CompatibilityAnalysisSection({ aiAnalysis }: Props) {
  // Static fallback categories
  const staticCategories = [
    {
      category: 'Educational Materials',
      confidence: 'High',
      description: 'Direct fit for curriculum categories',
      reasoning: 'Core educational materials are typically eligible'
    },
    {
      category: 'Assessment Services', 
      confidence: 'Medium',
      description: 'Varies by program, often restricted',
      reasoning: 'Assessment services may have specific requirements'
    }
  ];

  const getConfidenceColor = (confidence: string) => {
    switch(confidence) {
      case 'High': return 'text-green-600 bg-green-50';
      case 'Good': return 'text-blue-600 bg-blue-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">ESA Compatibility Analysis</h2>
      
      <div className="space-y-4">
        {/* Use AI Analysis Data if available */}
        {aiAnalysis?.analysis?.productAnalysis?.productCategories ? (
          aiAnalysis.analysis.productAnalysis.productCategories.map((category, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{category.category}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  category.esaEligibility === 'high' ? 'text-green-600 bg-green-50' :
                  category.esaEligibility === 'medium' ? 'text-yellow-600 bg-yellow-50' :
                  'text-red-600 bg-red-50'
                }`}>
                  {category.esaEligibility} eligibility
                </span>
              </div>
              <p className="text-xs text-gray-600">{category.reasoning}</p>
              <p className="text-xs text-gray-500 mt-1">
                Products: {category.products?.join(', ')} | Confidence: {Math.round((category.confidence || 0.7) * 100)}%
              </p>
            </div>
          ))
        ) : (
          /* Fallback to static categories */
          staticCategories.map((category, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{category.category}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor(category.confidence)}`}>
                  {category.confidence} Match
                </span>
              </div>
              <p className="text-xs text-gray-600">{category.description}</p>
            </div>
          ))
        )}
      </div>

      {/* Strategic Recommendation */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">
          🎯 <strong>Strategic Recommendation:</strong> Focus on Educational Materials for fastest market entry
        </p>
      </div>
    </div>
  );
}