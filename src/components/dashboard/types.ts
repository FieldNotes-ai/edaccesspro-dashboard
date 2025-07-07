// Dashboard type definitions
export interface ESAProgram {
  id: string;
  state: string;
  name: string;
  portalTechnology: string;
  annualAmount: string;
  vendorPaymentMethod: string;
  programStatus: string;
  currentWindowStatus: string;
  allowedVendorTypes?: string[];
  complexityScore?: number;
  revenueOpportunity?: 'High' | 'Medium' | 'Low';
  priceParity?: boolean;
  currentMarketSize?: number;
  requiredDocuments?: string[];
  submissionMethod?: string;
}

export interface StateData {
  state: string;
  programs: ESAProgram[];
  totalRevenue: number;
  dominantPortal: string;
  complexityScore: number;
  revenueOpportunity: 'High' | 'Medium' | 'Low';
  vendorCount: number;
}

export type SortOption = 'revenue' | 'complexity' | 'alphabetical';
export type FilterOption = 'All' | 'ClassWallet' | 'Odyssey' | 'Step Up For Students' | 'Student First' | 'Other';