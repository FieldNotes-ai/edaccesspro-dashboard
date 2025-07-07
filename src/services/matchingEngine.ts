import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class AdvancedMatchingEngine {
  matchingCriteria: any;
  programDifficulty: any;
  
  constructor() {
    this.matchingCriteria = {
      productAlignment: 0.25,      // How well products fit program eligibility
      operationalFeasibility: 0.20, // Can vendor handle program requirements
      marketOpportunity: 0.20,     // Size and potential of the market
      complianceReadiness: 0.15,   // Regulatory and documentation readiness
      competitivePosition: 0.10,   // Vendor's competitive advantage
      resourceCapacity: 0.10       // Vendor capacity vs program demands
    };

    this.programDifficulty = {
      'ClassWallet': { // Arizona ESA
        complexity: 7,
        documentation: 8,
        approval_time: 6,
        ongoing_compliance: 7
      },
      'Odyssey': { // Utah
        complexity: 6,
        documentation: 7,
        approval_time: 5,
        ongoing_compliance: 6
      },
      'Step Up For Students': { // Florida
        complexity: 8,
        documentation: 9,
        approval_time: 7,
        ongoing_compliance: 8
      },
      'Other': { // Custom systems
        complexity: 5,
        documentation: 6,
        approval_time: 4,
        ongoing_compliance: 5
      }
    };
  }

  async generateAdvancedMatches(vendorData, availablePrograms, productAnalysis) {
    try {
      const matches = [];

      for (const program of availablePrograms) {
        const matchScore = await this.calculateProgramMatch(
          vendorData,
          program,
          productAnalysis
        );
        
        matches.push({
          program,
          matchScore,
          recommendation: this.generateRecommendation(matchScore, program),
          actionItems: this.generateActionItems(matchScore, program, vendorData),
          timeline: this.estimateTimeline(matchScore, program),
          riskAssessment: this.assessRisks(matchScore, program, vendorData)
        });
      }

      // Sort by match score and return top recommendations
      matches.sort((a, b) => b.matchScore.overall - a.matchScore.overall);

      return {
        success: true,
        matches: matches,
        summary: this.generateMatchingSummary(matches, vendorData),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Advanced Matching Error:', error);
      return {
        success: false,
        error: error.message,
        fallbackMatches: this.generateBasicMatches(vendorData, availablePrograms)
      };
    }
  }

  async calculateProgramMatch(vendorData, program, productAnalysis) {
    // Base scoring components
    const scores = {
      productAlignment: await this.scoreProductAlignment(vendorData, program, productAnalysis),
      operationalFeasibility: this.scoreOperationalFeasibility(vendorData, program),
      marketOpportunity: this.scoreMarketOpportunity(vendorData, program),
      complianceReadiness: this.scoreComplianceReadiness(vendorData, program),
      competitivePosition: this.scoreCompetitivePosition(vendorData, program, productAnalysis),
      resourceCapacity: this.scoreResourceCapacity(vendorData, program)
    };

    // Calculate weighted overall score (1-10 scale)
    const weightedScore = Object.entries(scores).reduce((total, [criteria, score]) => {
      return total + (score * this.matchingCriteria[criteria]);
    }, 0);

    return {
      overall: Math.round(weightedScore * 10) / 10, // Round to 1 decimal
      breakdown: scores,
      confidence: this.calculateConfidence(scores),
      rationale: this.generateScoreRationale(scores, program)
    };
  }

  async scoreProductAlignment(vendorData, program, productAnalysis) {
    if (!productAnalysis?.analysis?.productCategories) return 0.5;

    const categories = productAnalysis.analysis.productCategories;
    const programEligibleProducts = program.eligibleProducts || '';

    // AI-enhanced product alignment scoring
    try {
      const alignmentPrompt = `
        Score product alignment (0.0-1.0) for this vendor's offerings against ESA program requirements:
        
        Vendor Categories: ${categories.map(c => `${c.category} (${c.esaEligibility})`).join(', ')}
        Program: ${program.name} (${program.state})
        Portal Technology: ${program.portalTechnology}
        Eligible Products: ${programEligibleProducts}
        
        Consider:
        - Category relevance to program
        - ESA eligibility levels
        - Portal-specific requirements
        - State-specific regulations
        
        Return just a number between 0.0 and 1.0.
      `;

      const completion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 10,
        temperature: 0.1,
        system: "You are an ESA program compliance expert. Return only a decimal number between 0.0 and 1.0.",
        messages: [
          {
            role: "user",
            content: alignmentPrompt
          }
        ]
      });

      const aiScore = parseFloat((completion.content[0] as any).text.trim());
      return isNaN(aiScore) ? 0.5 : Math.max(0, Math.min(1, aiScore));

    } catch (error) {
      // Fallback to rule-based scoring
      const highEligibility = categories.filter(c => c.esaEligibility === 'high').length;
      const mediumEligibility = categories.filter(c => c.esaEligibility === 'medium').length;
      
      return Math.min(1.0, (highEligibility * 0.3 + mediumEligibility * 0.15) / categories.length);
    }
  }

  scoreOperationalFeasibility(vendorData, program) {
    let score = 0.6; // base score

    const difficulty = this.programDifficulty[program.portalTechnology] || this.programDifficulty['Other'];
    
    // Organization type factors
    const orgTypes = vendorData.organizationType || [];
    if (orgTypes.includes('Educational Service Provider')) score += 0.2;
    if (orgTypes.includes('Technology Company')) score += 0.15;
    if (orgTypes.includes('Curriculum Publisher')) score += 0.15;

    // Experience indicators
    if (vendorData.currentEnrollments?.length > 0) score += 0.2;
    if (vendorData.servicesUrl) score += 0.1;

    // Adjust for program complexity
    const complexityPenalty = (difficulty.complexity - 5) * 0.02;
    score -= complexityPenalty;

    return Math.max(0, Math.min(1, score));
  }

  scoreMarketOpportunity(vendorData, program) {
    let score = 0.5; // base score

    // State market factors
    const marketSizes = {
      'Arizona': 0.9,   // Large ESA program
      'Florida': 1.0,   // Largest market
      'Utah': 0.7,      // Growing program
      'default': 0.5
    };

    score = marketSizes[program.state] || marketSizes['default'];

    // Program status
    if (program.status === 'Active') score += 0.1;
    if (program.currentWindowStatus?.includes('Open')) score += 0.1;

    // Annual amount available
    const annualAmount = program.annualAmount || '';
    if (annualAmount.includes('million') || annualAmount.includes('$100')) score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  scoreComplianceReadiness(vendorData, program) {
    let score = 0.4; // base score

    // Organization maturity indicators
    if (vendorData.servicesUrl) score += 0.1;
    if (vendorData.phone) score += 0.1;
    
    // Business readiness
    const orgTypes = vendorData.organizationType || [];
    if (orgTypes.length > 0) score += 0.2;

    // Program-specific requirements
    if (program.backgroundCheckRequired && orgTypes.includes('Educational Service Provider')) {
      score += 0.1;
    }
    
    if (program.insuranceRequired && vendorData.organizationType?.length > 0) {
      score += 0.1;
    }

    // Portal technology familiarity
    const portalComplexity = this.programDifficulty[program.portalTechnology]?.documentation || 5;
    score += (10 - portalComplexity) * 0.02;

    return Math.max(0, Math.min(1, score));
  }

  scoreCompetitivePosition(vendorData, program, productAnalysis) {
    let score = 0.5; // base score

    if (productAnalysis?.analysis?.marketSizing?.competitivePosition) {
      const position = productAnalysis.analysis.marketSizing.competitivePosition;
      if (position === 'strong') score = 0.8;
      else if (position === 'moderate') score = 0.6;
      else score = 0.4;
    }

    // Specialization bonus
    const categories = productAnalysis?.analysis?.productCategories || [];
    const highConfidenceCategories = categories.filter(c => c.confidence > 0.7).length;
    score += Math.min(0.2, highConfidenceCategories * 0.1);

    return Math.max(0, Math.min(1, score));
  }

  scoreResourceCapacity(vendorData, program) {
    let score = 0.6; // base score

    // Organization size indicators
    const orgTypes = vendorData.organizationType || [];
    if (orgTypes.includes('Large Corporation')) score += 0.2;
    else if (orgTypes.includes('Small Business')) score += 0.1;

    // Current market presence
    if (vendorData.currentEnrollments?.length >= 3) score += 0.2;
    else if (vendorData.currentEnrollments?.length >= 1) score += 0.1;

    // Program demands vs capacity
    const difficulty = this.programDifficulty[program.portalTechnology] || this.programDifficulty['Other'];
    const demandScore = (difficulty.complexity + difficulty.ongoing_compliance) / 20;
    score -= demandScore * 0.3;

    return Math.max(0, Math.min(1, score));
  }

  calculateConfidence(scores) {
    // Higher confidence if scores are consistent
    const values = Object.values(scores) as number[];
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Lower variance = higher confidence
    return Math.max(0.3, Math.min(1.0, 1 - variance));
  }

  generateScoreRationale(scores, program) {
    const topFactors = Object.entries(scores)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([factor, score]) => `${factor}: ${((score as number) * 10).toFixed(1)}/10`);

    const bottomFactor = Object.entries(scores)
      .sort(([,a], [,b]) => (a as number) - (b as number))[0];

    return {
      strengths: topFactors,
      primaryWeakness: `${bottomFactor[0]}: ${((bottomFactor[1] as number) * 10).toFixed(1)}/10`,
      programSpecific: `${program.portalTechnology} portal in ${program.state}`
    };
  }

  generateRecommendation(matchScore, program) {
    const score = matchScore.overall;
    
    if (score >= 8.0) {
      return {
        priority: 'high',
        action: 'immediate_enrollment',
        message: 'Excellent match - prioritize immediate enrollment',
        expectedSuccess: 'very_high'
      };
    } else if (score >= 6.5) {
      return {
        priority: 'medium',
        action: 'strategic_preparation',
        message: 'Strong potential - prepare thoroughly before applying',
        expectedSuccess: 'high'
      };
    } else if (score >= 5.0) {
      return {
        priority: 'low',
        action: 'selective_consideration',
        message: 'Moderate fit - consider if aligned with business strategy',
        expectedSuccess: 'moderate'
      };
    } else {
      return {
        priority: 'defer',
        action: 'improvement_needed',
        message: 'Significant challenges - address weaknesses before pursuing',
        expectedSuccess: 'low'
      };
    }
  }

  generateActionItems(matchScore, program, vendorData) {
    const actions = [];
    const scores = matchScore.breakdown;

    // Product alignment actions
    if (scores.productAlignment < 0.6) {
      actions.push({
        category: 'Product Positioning',
        action: 'Review and enhance product descriptions for ESA eligibility',
        priority: 'high'
      });
    }

    // Compliance actions
    if (scores.complianceReadiness < 0.6) {
      actions.push({
        category: 'Compliance Preparation',
        action: `Prepare documentation for ${program.portalTechnology} portal requirements`,
        priority: 'high'
      });
    }

    // Operational actions
    if (scores.operationalFeasibility < 0.6) {
      actions.push({
        category: 'Operational Readiness',
        action: 'Assess capacity for ESA program management',
        priority: 'medium'
      });
    }

    // Program-specific actions
    if (program.backgroundCheckRequired) {
      actions.push({
        category: 'Background Verification',
        action: 'Complete background check requirements for instructors',
        priority: 'high'
      });
    }

    if (program.insuranceRequired) {
      actions.push({
        category: 'Insurance Requirements',
        action: `Secure minimum ${program.insuranceMinimum || 'required'} insurance coverage`,
        priority: 'high'
      });
    }

    return actions;
  }

  estimateTimeline(matchScore, program) {
    const baseWeeks = {
      'ClassWallet': 8,
      'Odyssey': 6,
      'Step Up For Students': 10,
      'Other': 4
    };

    const base = baseWeeks[program.portalTechnology] || baseWeeks['Other'];
    const score = matchScore.overall;
    
    // Higher scores = faster implementation
    const adjustment = score >= 7 ? -2 : score <= 4 ? 4 : 0;
    
    return {
      estimatedWeeks: Math.max(2, base + adjustment),
      phases: [
        'Documentation Preparation (1-2 weeks)',
        'Application Submission (1 week)',
        'Review & Approval Process (2-6 weeks)',
        'Portal Setup & Training (1-2 weeks)'
      ],
      criticalPath: matchScore.breakdown.complianceReadiness < 0.5 ? 
        'Documentation preparation is critical path' : 
        'Standard approval process timeline'
    };
  }

  assessRisks(matchScore, program, vendorData) {
    const risks = [];

    // Low score risks
    if (matchScore.overall < 5.0) {
      risks.push({
        type: 'approval',
        severity: 'high',
        description: 'Low overall compatibility may result in application rejection'
      });
    }

    // Compliance risks
    if (matchScore.breakdown.complianceReadiness < 0.4) {
      risks.push({
        type: 'compliance',
        severity: 'medium',
        description: 'Documentation gaps may delay or prevent approval'
      });
    }

    // Operational risks
    if (matchScore.breakdown.resourceCapacity < 0.4) {
      risks.push({
        type: 'operational',
        severity: 'medium',
        description: 'Limited capacity may impact program success'
      });
    }

    // Program-specific risks
    const difficulty = this.programDifficulty[program.portalTechnology];
    if (difficulty?.complexity >= 8) {
      risks.push({
        type: 'complexity',
        severity: 'medium',
        description: 'High program complexity requires significant operational commitment'
      });
    }

    return risks;
  }

  generateMatchingSummary(matches, vendorData) {
    const topMatches = matches.slice(0, 3);
    const averageScore = matches.reduce((sum, m) => sum + m.matchScore.overall, 0) / matches.length;

    return {
      recommendedPrograms: topMatches.length,
      averageCompatibility: Math.round(averageScore * 10) / 10,
      highPotentialPrograms: matches.filter(m => m.matchScore.overall >= 7.0).length,
      immediateOpportunities: matches.filter(m => m.recommendation.action === 'immediate_enrollment').length,
      strategicRecommendation: this.generateStrategicRecommendation(topMatches, vendorData)
    };
  }

  generateStrategicRecommendation(topMatches, vendorData) {
    if (topMatches.length === 0) return 'Focus on product-market alignment before pursuing ESA programs';
    
    const bestMatch = topMatches[0];
    if (bestMatch.matchScore.overall >= 8.0) {
      return `Excellent fit for ${bestMatch.program.name} - recommend immediate pursuit`;
    } else if (bestMatch.matchScore.overall >= 6.5) {
      return `Strong potential with ${bestMatch.program.name} - prepare thoroughly for application`;
    } else {
      return 'Consider selective targeting of top-scoring programs while building capabilities';
    }
  }

  generateBasicMatches(vendorData, availablePrograms) {
    // Fallback basic matching if AI fails
    return availablePrograms.map(program => ({
      program,
      matchScore: {
        overall: 5.0,
        breakdown: {
          productAlignment: 0.5,
          operationalFeasibility: 0.5,
          marketOpportunity: 0.5,
          complianceReadiness: 0.5,
          competitivePosition: 0.5,
          resourceCapacity: 0.5
        },
        confidence: 0.3,
        rationale: 'Basic matching only - limited analysis available'
      },
      recommendation: {
        priority: 'medium',
        action: 'manual_evaluation',
        message: 'Manual evaluation recommended',
        expectedSuccess: 'unknown'
      }
    }));
  }
}

export default AdvancedMatchingEngine;