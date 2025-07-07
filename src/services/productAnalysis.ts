import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class ProductAnalysisAgent {
  esaCategories: any;
  
  constructor() {
    this.esaCategories = {
      'Tutoring Services': {
        description: 'One-on-one or small group instructional services',
        keywords: ['tutor', 'instruction', 'academic support', 'teaching'],
        eligibilityFactors: ['qualified instructor', 'educational objectives', 'supplemental instruction']
      },
      'Curriculum & Content': {
        description: 'Educational materials, textbooks, and structured learning content',
        keywords: ['curriculum', 'textbook', 'workbook', 'educational materials'],
        eligibilityFactors: ['age-appropriate', 'educational standards', 'structured learning']
      },
      'Educational Technology': {
        description: 'Software, apps, and digital learning platforms',
        keywords: ['software', 'app', 'digital learning', 'educational technology'],
        eligibilityFactors: ['educational purpose', 'student progress tracking', 'curriculum alignment']
      },
      'Assessment & Testing': {
        description: 'Standardized tests, evaluations, and progress assessments',
        keywords: ['test', 'assessment', 'evaluation', 'SAT', 'ACT'],
        eligibilityFactors: ['standardized format', 'educational measurement', 'progress tracking']
      },
      'Educational Therapies': {
        description: 'Specialized services for learning differences and disabilities',
        keywords: ['therapy', 'OT', 'PT', 'speech', 'special needs'],
        eligibilityFactors: ['licensed practitioner', 'educational necessity', 'IEP compliance']
      },
      'Enrichment Programs': {
        description: 'Camps, extracurricular activities, and skill development',
        keywords: ['camp', 'enrichment', 'extracurricular', 'STEM'],
        eligibilityFactors: ['educational component', 'skill development', 'age-appropriate']
      }
    };
  }

  async analyzeVendorCatalog(vendorData) {
    try {
      const {
        companyName,
        productServices,
        servicesUrl,
        targetAgeGroups,
        primarySubjects,
        organizationType
      } = vendorData;

      // Enhanced AI analysis prompt
      const analysisPrompt = `
        Analyze this educational vendor's offerings for ESA (Education Savings Account) program eligibility:

        Company: ${companyName}
        Services/Products: ${productServices}
        Website: ${servicesUrl || 'Not provided'}
        Target Ages: ${targetAgeGroups?.join(', ') || 'Not specified'}
        Subjects: ${primarySubjects?.join(', ') || 'Not specified'}
        Organization Type: ${organizationType?.join(', ') || 'Not specified'}

        Please provide a detailed analysis in JSON format with the following structure:
        {
          "productCategories": [
            {
              "category": "ESA category name",
              "confidence": 0.0-1.0,
              "products": ["specific product/service names"],
              "ageRanges": ["age ranges this applies to"],
              "subjects": ["subject areas covered"],
              "esaEligibility": "high|medium|low",
              "reasoning": "why this category applies"
            }
          ],
          "overallAssessment": {
            "esaReadiness": "high|medium|low",
            "primaryStrengths": ["key strengths for ESA market"],
            "potentialChallenges": ["potential compliance or eligibility issues"],
            "recommendedFocus": ["which ESA categories to prioritize"]
          },
          "marketSizing": {
            "targetMarkets": ["which states/programs are best fit"],
            "estimatedVolume": "high|medium|low",
            "competitivePosition": "strong|moderate|developing"
          }
        }

        Focus on ESA-specific eligibility criteria and provide actionable insights for program enrollment.
      `;

      const completion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: "You are an ESA (Education Savings Account) program compliance and market analysis expert. Provide detailed, actionable analysis for educational vendors seeking to participate in state ESA programs. Always respond with valid JSON.",
        messages: [
          {
            role: "user",
            content: analysisPrompt
          }
        ]
      });

      const analysis = JSON.parse((completion.content[0] as any).text);
      
      // Enhance with additional scoring
      const enhancedAnalysis = this.enhanceAnalysisWithScoring(analysis, vendorData);
      
      return {
        success: true,
        analysis: enhancedAnalysis,
        timestamp: new Date().toISOString(),
        vendor: companyName
      };

    } catch (error) {
      console.error('Product Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        fallbackAnalysis: this.generateFallbackAnalysis(vendorData)
      };
    }
  }

  enhanceAnalysisWithScoring(aiAnalysis, vendorData) {
    // Add quantitative scoring to AI analysis
    const scoring = {
      complianceScore: this.calculateComplianceScore(aiAnalysis),
      marketOpportunityScore: this.calculateMarketOpportunity(aiAnalysis),
      competitiveAdvantageScore: this.calculateCompetitiveAdvantage(aiAnalysis),
      overallViabilityScore: 0
    };

    scoring.overallViabilityScore = (
      scoring.complianceScore * 0.4 +
      scoring.marketOpportunityScore * 0.35 +
      scoring.competitiveAdvantageScore * 0.25
    );

    return {
      ...aiAnalysis,
      quantitativeScoring: scoring,
      recommendations: this.generateActionableRecommendations(aiAnalysis, scoring),
      riskFactors: this.identifyRiskFactors(aiAnalysis, vendorData)
    };
  }

  calculateComplianceScore(analysis) {
    let score = 0;
    const categories = analysis.productCategories || [];
    
    categories.forEach(cat => {
      if (cat.esaEligibility === 'high') score += 30;
      else if (cat.esaEligibility === 'medium') score += 20;
      else if (cat.esaEligibility === 'low') score += 10;
    });

    // Bonus for multiple high-eligibility categories
    const highEligibility = categories.filter(c => c.esaEligibility === 'high').length;
    if (highEligibility >= 2) score += 20;

    return Math.min(score, 100);
  }

  calculateMarketOpportunity(analysis) {
    const marketSizing = analysis.marketSizing || {};
    let score = 50; // base score

    if (marketSizing.estimatedVolume === 'high') score += 30;
    else if (marketSizing.estimatedVolume === 'medium') score += 15;

    if (marketSizing.targetMarkets?.length >= 3) score += 20;
    else if (marketSizing.targetMarkets?.length >= 2) score += 10;

    return Math.min(score, 100);
  }

  calculateCompetitiveAdvantage(analysis) {
    const competitive = analysis.marketSizing?.competitivePosition || 'developing';
    const strengths = analysis.overallAssessment?.primaryStrengths?.length || 0;

    let score = 30; // base score
    
    if (competitive === 'strong') score += 40;
    else if (competitive === 'moderate') score += 20;

    score += Math.min(strengths * 10, 30);

    return Math.min(score, 100);
  }

  generateActionableRecommendations(analysis, scoring) {
    const recommendations = [];

    // High-level strategic recommendations
    if (scoring.overallViabilityScore >= 80) {
      recommendations.push({
        priority: 'high',
        category: 'Market Entry',
        action: 'Prioritize immediate ESA program enrollment',
        rationale: 'Strong overall viability across all key metrics'
      });
    } else if (scoring.overallViabilityScore >= 60) {
      recommendations.push({
        priority: 'medium',
        category: 'Market Entry',
        action: 'Selective ESA program targeting',
        rationale: 'Good viability with focused approach recommended'
      });
    }

    // Compliance-specific recommendations
    if (scoring.complianceScore < 70) {
      recommendations.push({
        priority: 'high',
        category: 'Compliance',
        action: 'Review and enhance product positioning for ESA eligibility',
        rationale: 'Current offerings may not align well with ESA program requirements'
      });
    }

    // Market opportunity recommendations
    const targetMarkets = analysis.marketSizing?.targetMarkets || [];
    if (targetMarkets.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Market Focus',
        action: `Focus initial efforts on: ${targetMarkets.slice(0, 2).join(', ')}`,
        rationale: 'These markets show highest compatibility with your offerings'
      });
    }

    return recommendations;
  }

  identifyRiskFactors(analysis, vendorData) {
    const risks = [];

    // Compliance risks
    const lowEligibility = analysis.productCategories?.filter(c => c.esaEligibility === 'low') || [];
    if (lowEligibility.length > 0) {
      risks.push({
        type: 'compliance',
        severity: 'medium',
        description: 'Some offerings may not meet ESA eligibility requirements',
        mitigation: 'Review product positioning and documentation'
      });
    }

    // Market risks
    if (analysis.marketSizing?.competitivePosition === 'developing') {
      risks.push({
        type: 'market',
        severity: 'low',
        description: 'Developing competitive position in ESA market',
        mitigation: 'Focus on differentiation and specialized offerings'
      });
    }

    // Operational risks
    const challenges = analysis.overallAssessment?.potentialChallenges || [];
    if (challenges.length > 2) {
      risks.push({
        type: 'operational',
        severity: 'medium',
        description: 'Multiple operational challenges identified',
        mitigation: 'Develop systematic approach to address identified challenges'
      });
    }

    return risks;
  }

  generateFallbackAnalysis(vendorData) {
    // Simple rule-based analysis if AI fails
    const { productServices, organizationType } = vendorData;
    const categories = [];
    
    Object.entries(this.esaCategories).forEach(([category, config]) => {
      const matches = (config as any).keywords.filter((keyword: string) => 
        productServices?.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      if (matches > 0) {
        categories.push({
          category,
          confidence: Math.min(matches / (config as any).keywords.length, 1.0),
          esaEligibility: matches >= 2 ? 'high' : matches === 1 ? 'medium' : 'low',
          reasoning: `Matched ${matches} relevant keywords`
        });
      }
    });

    return {
      productCategories: categories,
      overallAssessment: {
        esaReadiness: categories.length >= 2 ? 'medium' : 'low',
        primaryStrengths: ['Basic product-category alignment identified'],
        potentialChallenges: ['Limited AI analysis available'],
        recommendedFocus: categories.slice(0, 2).map(c => c.category)
      },
      marketSizing: {
        targetMarkets: ['Arizona', 'Florida'], // Default high-volume markets
        estimatedVolume: 'medium',
        competitivePosition: 'developing'
      },
      fallback: true
    };
  }

  async extractProductsFromUrl(url) {
    // Future enhancement: scrape and analyze vendor websites
    // For now, return placeholder
    return {
      success: false,
      message: 'URL analysis not yet implemented',
      suggestedApproach: 'Please provide detailed product/service descriptions'
    };
  }

  async parseDocumentContent(documentBuffer, filename) {
    // Future enhancement: parse PDF catalogs, brochures
    // For now, return placeholder  
    return {
      success: false,
      message: 'Document parsing not yet implemented',
      suggestedApproach: 'Please provide text description of products/services'
    };
  }
}

export default ProductAnalysisAgent;