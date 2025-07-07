import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class StrategicAnalysisEngine {
  constructor() {
    this.marketData = {
      'Arizona': {
        totalEnrollment: 75000,
        avgAward: 7500,
        growthRate: 0.15,
        vendorCount: 2500,
        marketMaturity: 'mature',
        competitiveIntensity: 'high'
      },
      'Florida': {
        totalEnrollment: 450000,
        avgAward: 8000,
        growthRate: 0.25,
        vendorCount: 8000,
        marketMaturity: 'expanding',
        competitiveIntensity: 'very_high'
      },
      'Utah': {
        totalEnrollment: 15000,
        avgAward: 6000,
        growthRate: 0.30,
        vendorCount: 800,
        marketMaturity: 'emerging',
        competitiveIntensity: 'moderate'
      },
      'default': {
        totalEnrollment: 10000,
        avgAward: 6500,
        growthRate: 0.20,
        vendorCount: 500,
        marketMaturity: 'emerging',
        competitiveIntensity: 'low'
      }
    };

    this.categoryMarketShare = {
      'Tutoring Services': 0.35,
      'Curriculum & Content': 0.25,
      'Educational Technology': 0.20,
      'Assessment & Testing': 0.08,
      'Educational Therapies': 0.07,
      'Enrichment Programs': 0.05
    };
  }

  async generateStrategicAnalysis(vendorData, matchingResults, productAnalysis) {
    try {
      const analysis = {
        marketSizing: await this.calculateMarketSizing(vendorData, matchingResults, productAnalysis),
        capacityAnalysis: this.analyzeVendorCapacity(vendorData, productAnalysis),
        opportunityMatrix: this.buildOpportunityMatrix(matchingResults, vendorData),
        revenueProjections: this.calculateRevenueProjections(vendorData, matchingResults, productAnalysis),
        strategicRecommendations: await this.generateStrategicRecommendations(vendorData, matchingResults, productAnalysis),
        riskAssessment: this.generateRiskAssessment(vendorData, matchingResults),
        implementationRoadmap: this.createImplementationRoadmap(matchingResults, vendorData)
      };

      return {
        success: true,
        analysis,
        timestamp: new Date().toISOString(),
        vendor: vendorData.companyName
      };

    } catch (error) {
      console.error('Strategic Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        fallbackAnalysis: this.generateBasicStrategicAnalysis(vendorData, matchingResults)
      };
    }
  }

  async calculateMarketSizing(vendorData, matchingResults, productAnalysis) {
    const topPrograms = matchingResults.matches?.slice(0, 5) || [];
    const marketSizing = {};

    for (const match of topPrograms) {
      const program = match.program;
      const state = program.state;
      const marketData = this.marketData[state] || this.marketData['default'];

      // Calculate addressable market for this vendor's categories
      const vendorCategories = productAnalysis?.analysis?.productCategories || [];
      let addressableMarketShare = 0;

      vendorCategories.forEach(category => {
        const categoryShare = this.categoryMarketShare[category.category] || 0.05;
        const confidenceWeight = category.confidence || 0.5;
        addressableMarketShare += categoryShare * confidenceWeight;
      });

      const totalMarketValue = marketData.totalEnrollment * marketData.avgAward;
      const addressableMarket = totalMarketValue * addressableMarketShare;

      marketSizing[state] = {
        totalMarketSize: totalMarketValue,
        addressableMarket: Math.round(addressableMarket),
        potentialStudents: Math.round(marketData.totalEnrollment * addressableMarketShare),
        averageAward: marketData.avgAward,
        growthRate: marketData.growthRate,
        competitiveIntensity: marketData.competitiveIntensity,
        estimatedVendorCount: marketData.vendorCount,
        marketShare: {
          realistic: this.calculateRealisticMarketShare(vendorData, marketData, match.matchScore.overall),
          optimistic: this.calculateOptimisticMarketShare(vendorData, marketData, match.matchScore.overall),
          conservative: this.calculateConservativeMarketShare(vendorData, marketData, match.matchScore.overall)
        }
      };
    }

    return {
      byState: marketSizing,
      totalAddressableMarket: Object.values(marketSizing).reduce((sum, m) => sum + m.addressableMarket, 0),
      priorityMarkets: this.identifyPriorityMarkets ? this.identifyPriorityMarkets(marketSizing, matchingResults) : [],
      marketTrends: await this.analyzeMarketTrends(topPrograms)
    };
  }

  calculateRealisticMarketShare(vendorData, marketData, matchScore) {
    let baseShare = 0.001; // 0.1% base market share

    // Adjust based on match score
    baseShare *= (matchScore / 5.0); // Scale by match quality

    // Adjust based on market maturity
    if (marketData.marketMaturity === 'emerging') baseShare *= 2.0;
    else if (marketData.marketMaturity === 'expanding') baseShare *= 1.5;
    else baseShare *= 1.0; // mature market

    // Adjust based on competitive intensity
    if (marketData.competitiveIntensity === 'low') baseShare *= 2.0;
    else if (marketData.competitiveIntensity === 'moderate') baseShare *= 1.3;
    else if (marketData.competitiveIntensity === 'high') baseShare *= 0.8;
    else baseShare *= 0.5; // very high

    return Math.min(0.05, Math.max(0.0001, baseShare)); // Cap at 5%, floor at 0.01%
  }

  calculateOptimisticMarketShare(vendorData, marketData, matchScore) {
    return this.calculateRealisticMarketShare(vendorData, marketData, matchScore) * 3;
  }

  calculateConservativeMarketShare(vendorData, marketData, matchScore) {
    return this.calculateRealisticMarketShare(vendorData, marketData, matchScore) * 0.5;
  }

  analyzeVendorCapacity(vendorData, productAnalysis) {
    const capacity = {
      currentCapacity: this.assessCurrentCapacity(vendorData),
      scalabilityFactors: this.assessScalability(vendorData, productAnalysis),
      resourceConstraints: this.identifyResourceConstraints(vendorData),
      capacityUtilization: this.calculateCapacityUtilization(vendorData),
      scalingRequirements: this.determineScalingRequirements(vendorData, productAnalysis)
    };

    capacity.capacityToOpportunityRatio = this.calculateCapacityOpportunityRatio(capacity, productAnalysis);

    return capacity;
  }

  assessCurrentCapacity(vendorData) {
    let capacityScore = 50; // base capacity score

    // Organization type indicators
    const orgTypes = vendorData.organizationType || [];
    if (orgTypes.includes('Large Corporation')) capacityScore += 30;
    else if (orgTypes.includes('Medium Business')) capacityScore += 15;
    else if (orgTypes.includes('Small Business')) capacityScore += 5;

    // Current market presence
    const currentEnrollments = vendorData.currentEnrollments?.length || 0;
    capacityScore += Math.min(20, currentEnrollments * 5);

    // Infrastructure indicators
    if (vendorData.servicesUrl) capacityScore += 10;
    if (vendorData.phone) capacityScore += 5;

    return {
      score: Math.min(100, capacityScore),
      level: capacityScore >= 80 ? 'high' : capacityScore >= 60 ? 'medium' : 'low',
      indicators: this.getCapacityIndicators(vendorData)
    };
  }

  assessScalability(vendorData, productAnalysis) {
    const factors = {};

    // Product scalability
    const categories = productAnalysis?.analysis?.productCategories || [];
    const techCategories = categories.filter(c => c.category === 'Educational Technology').length;
    factors.productScalability = techCategories > 0 ? 'high' : 'medium';

    // Service delivery model
    const orgTypes = vendorData.organizationType || [];
    if (orgTypes.includes('Technology Company')) {
      factors.deliveryScalability = 'high';
    } else if (orgTypes.includes('Educational Service Provider')) {
      factors.deliveryScalability = 'medium';
    } else {
      factors.deliveryScalability = 'low';
    }

    // Geographic scalability
    factors.geographicScalability = vendorData.interestedStates?.length >= 3 ? 'high' : 'medium';

    return factors;
  }

  identifyResourceConstraints(vendorData) {
    const constraints = [];

    // Human resources
    const orgTypes = vendorData.organizationType || [];
    if (orgTypes.includes('Small Business')) {
      constraints.push({
        type: 'human_resources',
        severity: 'medium',
        description: 'Limited staff for multiple ESA program management',
        mitigation: 'Consider graduated market entry or partnership approaches'
      });
    }

    // Financial constraints
    if (!vendorData.selectedTier || vendorData.selectedTier === 'free') {
      constraints.push({
        type: 'financial',
        severity: 'low',
        description: 'Limited budget for platform features',
        mitigation: 'Focus on highest-ROI programs first'
      });
    }

    // Technical constraints
    if (!vendorData.servicesUrl) {
      constraints.push({
        type: 'technical',
        severity: 'medium',
        description: 'Limited online presence for ESA portal integration',
        mitigation: 'Develop basic website and product catalog'
      });
    }

    return constraints;
  }

  calculateCapacityUtilization(vendorData) {
    const currentPrograms = vendorData.currentEnrollments?.length || 0;
    const maxRecommendedPrograms = this.getMaxRecommendedPrograms(vendorData);

    return {
      current: currentPrograms,
      maximum: maxRecommendedPrograms,
      utilizationRate: currentPrograms / maxRecommendedPrograms,
      available: maxRecommendedPrograms - currentPrograms
    };
  }

  getMaxRecommendedPrograms(vendorData) {
    const orgTypes = vendorData.organizationType || [];
    
    if (orgTypes.includes('Large Corporation')) return 10;
    if (orgTypes.includes('Medium Business')) return 6;
    if (orgTypes.includes('Small Business')) return 3;
    
    return 2; // default for unclear organization size
  }

  calculateCapacityOpportunityRatio(capacity, productAnalysis) {
    const capacityScore = capacity.currentCapacity.score;
    const opportunityScore = productAnalysis?.quantitativeScoring?.marketOpportunityScore || 50;

    const ratio = capacityScore / opportunityScore;

    return {
      ratio: Math.round(ratio * 100) / 100,
      interpretation: ratio >= 1.2 ? 'over_capacity' : 
                     ratio >= 0.8 ? 'balanced' : 
                     ratio >= 0.5 ? 'opportunity_constrained' : 'severely_constrained',
      recommendation: this.getCapacityRecommendation(ratio)
    };
  }

  getCapacityRecommendation(ratio) {
    if (ratio >= 1.2) return 'Consider aggressive market expansion';
    if (ratio >= 0.8) return 'Well-positioned for current opportunities';
    if (ratio >= 0.5) return 'Focus on high-impact programs, build capacity gradually';
    return 'Address capacity constraints before major market expansion';
  }

  buildOpportunityMatrix(matchingResults, vendorData) {
    const matches = matchingResults.matches || [];
    const matrix = {
      high_score_high_market: [],
      high_score_low_market: [],
      low_score_high_market: [],
      low_score_low_market: []
    };

    matches.forEach(match => {
      const score = match.matchScore.overall;
      const marketSize = this.getMarketSize(match.program.state);
      
      const highScore = score >= 6.5;
      const highMarket = marketSize >= 100000000; // $100M+

      if (highScore && highMarket) matrix.high_score_high_market.push(match);
      else if (highScore && !highMarket) matrix.high_score_low_market.push(match);
      else if (!highScore && highMarket) matrix.low_score_high_market.push(match);
      else matrix.low_score_low_market.push(match);
    });

    return {
      matrix,
      recommendations: this.generateMatrixRecommendations(matrix)
    };
  }

  getMarketSize(state) {
    const marketData = this.marketData[state] || this.marketData['default'];
    return marketData.totalEnrollment * marketData.avgAward;
  }

  generateMatrixRecommendations(matrix) {
    const recommendations = [];

    if (matrix.high_score_high_market.length > 0) {
      recommendations.push({
        priority: 'immediate',
        category: 'Prime Opportunities',
        programs: matrix.high_score_high_market.map(m => m.program.name),
        action: 'Prioritize immediate enrollment in these high-potential, large markets'
      });
    }

    if (matrix.high_score_low_market.length > 0) {
      recommendations.push({
        priority: 'secondary',
        category: 'Niche Excellence',
        programs: matrix.high_score_low_market.map(m => m.program.name),
        action: 'Consider for specialized positioning or testing ground'
      });
    }

    if (matrix.low_score_high_market.length > 0) {
      recommendations.push({
        priority: 'development',
        category: 'Future Potential',
        programs: matrix.low_score_high_market.map(m => m.program.name),
        action: 'Build capabilities to address these large market opportunities'
      });
    }

    return recommendations;
  }

  calculateRevenueProjections(vendorData, matchingResults, productAnalysis) {
    const matches = matchingResults.matches?.slice(0, 5) || [];
    const projections = {
      year1: { conservative: 0, realistic: 0, optimistic: 0 },
      year2: { conservative: 0, realistic: 0, optimistic: 0 },
      year3: { conservative: 0, realistic: 0, optimistic: 0 }
    };

    matches.forEach(match => {
      const program = match.program;
      const marketData = this.marketData[program.state] || this.marketData['default'];
      const revenueEstimate = this.calculateProgramRevenue(match, marketData, productAnalysis);

      // Year 1 - ramp up
      projections.year1.conservative += (revenueEstimate?.conservative || 0) * 0.3;
      projections.year1.realistic += (revenueEstimate?.realistic || 0) * 0.5;
      projections.year1.optimistic += (revenueEstimate?.optimistic || 0) * 0.7;

      // Year 2 - full operation
      projections.year2.conservative += (revenueEstimate?.conservative || 0) * 0.8;
      projections.year2.realistic += (revenueEstimate?.realistic || 0) * 1.0;
      projections.year2.optimistic += (revenueEstimate?.optimistic || 0) * 1.3;

      // Year 3 - growth + market expansion
      const growthFactor = 1 + (marketData?.growthRate || 0.1);
      projections.year3.conservative += (revenueEstimate?.conservative || 0) * 1.0 * growthFactor;
      projections.year3.realistic += (revenueEstimate?.realistic || 0) * 1.2 * growthFactor;
      projections.year3.optimistic += (revenueEstimate?.optimistic || 0) * 1.5 * growthFactor;
    });

    // Round projections
    Object.keys(projections).forEach(year => {
      Object.keys(projections[year]).forEach(scenario => {
        projections[year][scenario] = Math.round(projections[year][scenario]);
      });
    });

    return {
      projections,
      assumptions: this.getRevenueAssumptions ? this.getRevenueAssumptions(vendorData, matches) : { marketPenetration: 0.3, averageOrderValue: 500, conversionRate: 0.05 },
      keyDrivers: this.identifyKeyRevenueDrivers ? this.identifyKeyRevenueDrivers(matches, productAnalysis) : ['Market penetration', 'Product-program fit', 'Operational efficiency']
    };
  }

  calculateProgramRevenue(match, marketData, productAnalysis) {
    try {
      const matchScore = match?.matchScore?.overall || 0.5;
      const marketSize = (marketData?.totalEnrollment || 1000) * (marketData?.avgAward || 5000);
    
      // Base market share calculation
      const baseShare = this.calculateRealisticMarketShare ? 
        this.calculateRealisticMarketShare(match.vendorData || {}, marketData, matchScore) : 
        0.001; // 0.1% default market share

      const conservative = marketSize * baseShare * 0.5;
      const realistic = marketSize * baseShare;
      const optimistic = marketSize * baseShare * 2.0;

      return { conservative, realistic, optimistic };
    } catch (error) {
      console.error('Error calculating program revenue:', error);
      // Return safe default values
      return { conservative: 10000, realistic: 25000, optimistic: 50000 };
    }
  }

  async generateStrategicRecommendations(vendorData, matchingResults, productAnalysis) {
    try {
      const strategicPrompt = `
        Generate strategic recommendations for this ESA vendor based on analysis:

        Vendor: ${vendorData.companyName}
        Organization Type: ${vendorData.organizationType?.join(', ') || 'Not specified'}
        Top Match Score: ${matchingResults.matches?.[0]?.matchScore?.overall || 'N/A'}
        Product Categories: ${productAnalysis?.analysis?.productCategories?.map(c => c.category).join(', ') || 'None'}

        Provide strategic recommendations in these areas:
        1. Market Entry Strategy
        2. Product Positioning
        3. Operational Scaling
        4. Competitive Differentiation
        5. Risk Mitigation

        Focus on actionable, specific recommendations for ESA market success.
      `;

      const completion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        temperature: 0.4,
        system: "You are a strategic business consultant specializing in education markets. Provide specific, actionable recommendations.",
        messages: [
          {
            role: "user",
            content: strategicPrompt
          }
        ]
      });

      const aiRecommendations = completion.content[0].text;

      return {
        aiGenerated: aiRecommendations,
        quantitative: this.generateQuantitativeRecommendations(vendorData, matchingResults, productAnalysis),
        prioritization: this.prioritizeRecommendations(vendorData, matchingResults)
      };

    } catch (error) {
      return {
        fallback: this.generateBasicRecommendations(vendorData, matchingResults),
        error: 'AI recommendations unavailable'
      };
    }
  }

  generateQuantitativeRecommendations(vendorData, matchingResults, productAnalysis) {
    const recommendations = [];
    const topMatches = matchingResults.matches?.slice(0, 3) || [];

    // Market entry timing
    if (topMatches.length > 0) {
      const avgScore = topMatches.reduce((sum, m) => sum + m.matchScore.overall, 0) / topMatches.length;
      
      if (avgScore >= 7.5) {
        recommendations.push({
          category: 'Market Entry',
          recommendation: 'Aggressive multi-state launch',
          rationale: `High average compatibility score: ${avgScore.toFixed(1)}/10`,
          timeframe: '3-6 months',
          investment: 'Medium-High'
        });
      } else if (avgScore >= 6.0) {
        recommendations.push({
          category: 'Market Entry',
          recommendation: 'Focused single-state pilot',
          rationale: `Moderate compatibility requires focused approach: ${avgScore.toFixed(1)}/10`,
          timeframe: '6-12 months',
          investment: 'Medium'
        });
      }
    }

    return recommendations;
  }

  createImplementationRoadmap(matchingResults, vendorData) {
    const topMatches = matchingResults.matches?.slice(0, 5) || [];
    const roadmap = {
      phase1: { timeframe: '0-3 months', objectives: [], programs: [] },
      phase2: { timeframe: '3-6 months', objectives: [], programs: [] },
      phase3: { timeframe: '6-12 months', objectives: [], programs: [] }
    };

    // Phase 1: High-scoring, operationally simple programs
    const phase1Programs = topMatches.filter(m => 
      m.matchScore.overall >= 7.0 && 
      m.matchScore.breakdown.operationalFeasibility >= 0.7
    );

    roadmap.phase1.programs = phase1Programs.map(m => m.program.name);
    roadmap.phase1.objectives = [
      'Complete documentation for high-readiness programs',
      'Submit applications for immediate opportunities',
      'Establish operational processes'
    ];

    // Phase 2: Medium-scoring programs requiring preparation
    const phase2Programs = topMatches.filter(m => 
      m.matchScore.overall >= 5.5 && 
      m.matchScore.overall < 7.0
    );

    roadmap.phase2.programs = phase2Programs.map(m => m.program.name);
    roadmap.phase2.objectives = [
      'Address compliance gaps identified in Phase 1',
      'Expand product positioning for additional programs',
      'Scale operational capacity'
    ];

    // Phase 3: Market expansion and optimization
    roadmap.phase3.objectives = [
      'Enter secondary markets based on Phase 1-2 learnings',
      'Optimize operations for efficiency',
      'Develop competitive differentiation'
    ];

    return roadmap;
  }

  async analyzeMarketTrends(programs) {
    const trends = {
      growthTrajectory: 'positive',
      emergingOpportunities: ['AI-powered tutoring', 'Micro-credentialing', 'Special needs services'],
      regulatoryTrends: 'expanding',
      competitiveLandscape: 'intensifying'
    };

    return trends;
  }

  getCapacityIndicators(vendorData) {
    const indicators = [];
    
    if (vendorData.servicesUrl) indicators.push('Established web presence');
    if (vendorData.currentEnrollments?.length > 0) indicators.push('Current ESA experience');
    if (vendorData.organizationType?.includes('Educational Service Provider')) indicators.push('Education sector expertise');
    
    return indicators;
  }

  generateRiskAssessment(vendorData, matchingResults) {
    return {
      marketRisks: ['Regulatory changes', 'Increased competition', 'Market saturation'],
      operationalRisks: ['Capacity constraints', 'Compliance challenges', 'Quality control'],
      mitigationStrategies: ['Diversified state portfolio', 'Graduated scaling approach', 'Strong compliance framework']
    };
  }

  generateBasicStrategicAnalysis(vendorData, matchingResults) {
    return {
      marketSizing: { totalAddressableMarket: 50000000 },
      capacityAnalysis: { currentCapacity: { level: 'medium' } },
      revenueProjections: { 
        year1: { realistic: 100000 },
        year2: { realistic: 250000 },
        year3: { realistic: 400000 }
      },
      strategicRecommendations: {
        fallback: 'Focus on top-scoring ESA programs, build operational capacity gradually'
      }
    };
  }

  prioritizeRecommendations(vendorData, matchingResults) {
    return {
      immediate: ['Complete top program applications'],
      shortTerm: ['Build operational capacity'],
      longTerm: ['Expand to additional states']
    };
  }

  generateBasicRecommendations(vendorData, matchingResults) {
    return [
      'Focus on highest-scoring program matches',
      'Build compliance documentation systematically',
      'Start with single state before expanding'
    ];
  }

  determineScalingRequirements(vendorData, productAnalysis) {
    return {
      staffing: 'Moderate increase needed',
      technology: 'Current systems adequate',
      compliance: 'Enhanced documentation required'
    };
  }
}

export default StrategicAnalysisEngine;