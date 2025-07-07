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
  matchedPrograms: any[];
}

export default function VendorProfileSection({ vendorData, matchedPrograms }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Complete Vendor Profile Analysis</h2>
      
      {/* Company Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Company:</span>
              <p className="text-gray-900">{vendorData.companyName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Contact:</span>
              <p className="text-gray-900">{vendorData.contactName} ({vendorData.email})</p>
            </div>
            {vendorData.phone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Phone:</span>
                <p className="text-gray-900">{vendorData.phone}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500">Organization Type:</span>
              <p className="text-gray-900">
                {Array.isArray(vendorData.organizationType) 
                  ? vendorData.organizationType.join(', ') 
                  : vendorData.organizationType}
              </p>
            </div>
            {vendorData.teamSize && (
              <div>
                <span className="text-sm font-medium text-gray-500">Team Size:</span>
                <p className="text-gray-900">{vendorData.teamSize}</p>
              </div>
            )}
            {vendorData.servicesUrl && (
              <div>
                <span className="text-sm font-medium text-gray-500">Website:</span>
                <a 
                  href={vendorData.servicesUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800"
                >
                  {vendorData.servicesUrl}
                </a>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Goals & Challenges</h3>
          <div className="space-y-3">
            {vendorData.primaryGoals && (
              <div>
                <span className="text-sm font-medium text-gray-500">Primary Goals:</span>
                <p className="text-gray-900">{vendorData.primaryGoals}</p>
              </div>
            )}
            {vendorData.biggestChallenge && (
              <div>
                <span className="text-sm font-medium text-gray-500">Biggest Challenge:</span>
                <p className="text-gray-900">{vendorData.biggestChallenge}</p>
              </div>
            )}
            {vendorData.interestedStates && vendorData.interestedStates.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Target States:</span>
                <p className="text-gray-900">{vendorData.interestedStates.join(', ')}</p>
              </div>
            )}
            {vendorData.currentEnrollments && vendorData.currentEnrollments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Current ESA Programs:</span>
                <p className="text-gray-900">
                  {(vendorData.currentEnrollments || []).map((enrollment, index) => {
                    // If it's an ID (starts with 'rec'), try to find the program name
                    if (typeof enrollment === 'string' && enrollment.startsWith('rec')) {
                      const program = matchedPrograms.find(p => p.id === enrollment);
                      return program ? program.name : enrollment;
                    }
                    return enrollment;
                  }).join(', ') || 'No current enrollments'}
                </p>
              </div>
            )}
            {vendorData.uploadedFiles && vendorData.uploadedFiles.length > 0 ? (
              <div>
                <span className="text-sm font-medium text-gray-500">Uploaded Documents:</span>
                <ul className="text-gray-900 list-disc list-inside">
                  {(vendorData.uploadedFiles || []).map((file, index) => (
                    <li key={index} className="text-sm">
                      {typeof file === 'string' ? file : file?.name || 'Unknown file'}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-gray-500">Uploaded Documents:</span>
                <p className="text-gray-400 text-sm">No documents uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}