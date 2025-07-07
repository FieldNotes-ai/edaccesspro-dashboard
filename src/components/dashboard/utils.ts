import { ESAProgram, StateData } from './types';

// State enrollment data - moved from dashboard component
export const STATE_ENROLLMENT_DATA: Record<string, number> = {
  'Arizona': 83704,
  'Iowa': 18000,
  'Tennessee': 2088,
  'Indiana': 862,
  'Mississippi': 345,
  'Florida': 429585, // FES-EO: 307,609 + FES-UA: 122,051
  'Texas': 0,
  'Louisiana': 2000,
  'Utah': 10000,
  'Georgia': 3000,
  'Alabama': 1000,
  'South Carolina': 5000,
  'North Carolina': 3000,
  'Wyoming': 1500,
  'Montana': 500,
  'Alaska': 300,
  'Idaho': 1200,
  'Kansas': 0,
  'Ohio': 0,
  'West Virginia': 8000,
  'Arkansas': 4000,
  'Missouri': 6000,
  'Wisconsin': 0,
  'Oklahoma': 0,
};

export const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  const amounts = amountStr.match(/\$?(\d{1,3}(?:,\d{3})*)/g);
  if (amounts && amounts.length > 0) {
    const numericAmounts = amounts.map(amt => parseInt(amt.replace(/[$,]/g, '')));
    return Math.max(...numericAmounts);
  }
  return 0;
};

export const extractMarketSize = (program: any): number => {
  if (program.currentMarketSize && program.currentMarketSize > 0) {
    return program.currentMarketSize;
  }
  
  const text = `${program.programInfo || ''} ${program.vendorInsights || ''}`.toLowerCase();
  
  const marketSizeMatch = text.match(/market size[:\s]*(\d{1,3}(?:,\d{3})*)\s*students/);
  if (marketSizeMatch) {
    return parseInt(marketSizeMatch[1].replace(/,/g, ''));
  }
  
  const enrollmentMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*students/);
  if (enrollmentMatch) {
    return parseInt(enrollmentMatch[1].replace(/,/g, ''));
  }
  
  return STATE_ENROLLMENT_DATA[program.state] || 1000;
};

export const calculateTotalMarketValue = (program: any): number => {
  const marketSize = extractMarketSize(program);
  const annualAmount = parseAmount(program.annualAmount || '0');
  return marketSize * annualAmount;
};

export const calculateComplexityScore = (program: any): number => {
  let score = 0;
  
  if (program.portalTechnology === 'ClassWallet') score += 30;
  else if (program.portalTechnology === 'Student First') score += 35;
  else if (program.portalTechnology === 'Step Up For Students') score += 25;
  else if (program.portalTechnology === 'Odyssey') score += 15;
  else score += 10;
  
  if (program.priceParity) score += 15;
  
  if (program.requiredDocuments && program.requiredDocuments.length > 2) {
    score += program.requiredDocuments.length * 2;
  }
  
  if (program.submissionMethod === 'Manual Review') score += 10;
  else if (program.submissionMethod === 'Email') score += 5;
  
  return Math.min(score, 100);
};

export const calculateRevenueOpportunity = (program: any): 'High' | 'Medium' | 'Low' => {
  const totalMarketValue = calculateTotalMarketValue(program);
  if (totalMarketValue > 200000000) return 'High';
  if (totalMarketValue > 50000000) return 'Medium';
  return 'Low';
};

export const getPortalFees = (portalTechnology: string): string => {
  switch (portalTechnology) {
    case 'ClassWallet': return '2.5% platform fee';
    case 'Odyssey': return '1-2% processing fee';
    case 'Step Up For Students': return 'No platform fee';
    case 'Student First': return 'Variable fees';
    default: return 'Manual processing';
  }
};

export const getComplexityColor = (score: number): string => {
  if (score < 30) return 'text-green-600';
  if (score < 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getStateColor = (state: StateData): string => {
  const colorMap = {
    'High': 'bg-green-500',
    'Medium': 'bg-yellow-500',
    'Low': 'bg-red-500'
  };
  return colorMap[state.revenueOpportunity];
};