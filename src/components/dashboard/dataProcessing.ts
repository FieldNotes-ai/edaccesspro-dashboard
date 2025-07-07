import { ESAProgram, StateData } from './types';
import { calculateComplexityScore, calculateRevenueOpportunity, calculateTotalMarketValue } from './utils';

export const processStateData = (programs: any[]): StateData[] => {
  const stateGroups = programs.reduce((acc, program) => {
    const state = program.state;
    if (!acc[state]) acc[state] = [];
    acc[state].push({
      ...program,
      complexityScore: calculateComplexityScore(program),
      revenueOpportunity: calculateRevenueOpportunity(program)
    });
    return acc;
  }, {} as Record<string, ESAProgram[]>);

  return Object.keys(stateGroups).map((state) => {
    const programs = stateGroups[state];
    const totalRevenue = programs.reduce((sum, program) => sum + calculateTotalMarketValue(program), 0);
    const avgComplexity = programs.reduce((sum, program) => sum + (program.complexityScore || 0), 0) / programs.length;
    
    // Determine dominant portal technology
    const portalCounts = programs.reduce((acc, program) => {
      const portal = program.portalTechnology || 'Other';
      acc[portal] = (acc[portal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantPortal = Object.keys(portalCounts).reduce((a, b) => 
      portalCounts[a] > portalCounts[b] ? a : b
    );
    
    // Calculate overall opportunity level for the state
    const highOpportunityPrograms = programs.filter(p => p.revenueOpportunity === 'High').length;
    const stateOpportunity: 'High' | 'Medium' | 'Low' = 
      highOpportunityPrograms > programs.length / 2 ? 'High' :
      totalRevenue > 100000000 ? 'Medium' : 'Low';

    return {
      state,
      programs,
      totalRevenue,
      dominantPortal,
      complexityScore: Math.round(avgComplexity),
      revenueOpportunity: stateOpportunity,
      vendorCount: programs.length
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

export const filterAndSortStates = (
  stateData: StateData[], 
  filterPortal: string, 
  sortBy: 'revenue' | 'complexity' | 'alphabetical'
): StateData[] => {
  let filtered = stateData;
  
  if (filterPortal !== 'All') {
    filtered = stateData.filter(state => 
      state.programs.some(program => 
        program.portalTechnology === filterPortal || 
        (filterPortal === 'Other' && !['ClassWallet', 'Odyssey', 'Step Up For Students', 'Student First'].includes(program.portalTechnology))
      )
    );
  }
  
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      case 'complexity':
        return a.complexityScore - b.complexityScore; // Easiest first
      case 'alphabetical':
        return a.state.localeCompare(b.state);
      default:
        return 0;
    }
  });
};