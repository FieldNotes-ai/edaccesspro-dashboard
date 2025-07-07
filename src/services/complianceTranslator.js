import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class ComplianceTranslator {
  constructor() {
    this.portalTerminologies = {
      'ClassWallet': {
        // Arizona ESA specific terminology
        'Tutoring Services': {
          approved: ['Instructional Services', 'Educational Tutoring', 'Academic Support Services'],
          primary: 'Instructional Services',
          requirements: ['Qualified instructor', 'Educational objectives', 'Individual or small group'],
          prohibitions: ['Recreational activities', 'Non-academic subjects'],
          confidence: 0.95
        },
        'Curriculum & Content': {
          approved: ['Curriculum and Educational Materials', 'Textbooks and Workbooks', 'Educational Content'],
          primary: 'Curriculum and Educational Materials',
          requirements: ['Educational purpose', 'Age-appropriate', 'Secular content'],
          prohibitions: ['Religious instruction', 'Adult-oriented content'],
          confidence: 0.90
        },
        'Educational Technology': {
          approved: ['Educational Software and Technology', 'Digital Learning Platforms', 'Educational Apps'],
          primary: 'Educational Software and Technology',
          requirements: ['Educational focus', 'Student progress tracking', 'Curriculum alignment'],
          prohibitions: ['Gaming without educational value', 'Social media apps'],
          confidence: 0.85
        }
      },
      'Odyssey': {
        // Utah ESA terminology
        'Tutoring Services': {
          approved: ['Tutoring Services', 'Individual Instruction', 'Educational Support'],
          primary: 'Tutoring Services',
          requirements: ['Qualified instructor', 'Educational content', 'Individual or group format'],
          prohibitions: ['Recreational instruction', 'Non-educational activities'],
          confidence: 0.90
        },
        'Curriculum & Content': {
          approved: ['Curriculum/Textbooks/Materials', 'Educational Materials', 'Learning Resources'],
          primary: 'Curriculum/Textbooks/Materials',
          requirements: ['Educational standards alignment', 'Age-appropriate content'],
          prohibitions: ['Non-educational materials', 'Entertainment media'],
          confidence: 0.92
        }
      },
      'Step Up For Students': {
        // Florida terminology
        'Tutoring Services': {
          approved: ['Educational Services', 'Tutoring Services', 'Academic Support'],
          primary: 'Educational Services',
          requirements: ['Qualified provider', 'Educational necessity', 'Individual or small group'],
          prohibitions: ['Recreational activities', 'Large group instruction'],
          confidence: 0.88
        },
        'Educational Therapies': {
          approved: ['Therapeutic Services', 'Educational Therapies', 'Specialized Services'],
          primary: 'Therapeutic Services',
          requirements: ['Licensed practitioner', 'Educational necessity', 'IEP/504 alignment'],
          prohibitions: ['Medical treatment', 'Non-educational therapy'],
          confidence: 0.93
        },
        'Curriculum & Content': {
          approved: ['Instructional Materials', 'Educational Materials', 'Curriculum Resources'],
          primary: 'Instructional Materials',
          requirements: ['Educational standards', 'Appropriate content', 'Student use'],
          prohibitions: ['Teacher-only materials', 'Non-educational content'],
          confidence: 0.87
        }
      },
      'Other': {
        // Generic ESA terminology for custom systems
        'Tutoring Services': {
          approved: ['Tutoring Services', 'Educational Services', 'Academic Support'],
          primary: 'Tutoring Services',
          requirements: ['Educational purpose', 'Qualified provider'],
          prohibitions: ['Non-educational activities'],
          confidence: 0.75
        },
        'Educational Therapies': {
          approved: ['Educational Therapies', 'Therapeutic Services', 'Special Education Services'],
          primary: 'Educational Therapies',
          requirements: ['Licensed provider', 'Educational necessity'],
          prohibitions: ['Medical therapy', 'Non-educational services'],
          confidence: 0.75
        }
      }
    };

    this.compliancePatterns = {
      highRisk: [
        'religious', 'recreational', 'entertainment', 'gaming', 'social media',
        'medical treatment', 'therapy not educational', 'adult content'
      ],
      mediumRisk: [
        'large group', 'unqualified instructor', 'non-educational',
        'teacher materials only', 'expensive equipment'
      ],
      lowRisk: [
        'educational', 'academic', 'instructional', 'learning', 'curriculum',
        'assessment', 'tutoring', 'qualified', 'certified'
      ]
    };
  }

  async translateProductsToESA(productList, portalTechnology, programState) {
    try {
      const translations = [];

      for (const product of productList) {
        const translation = await this.translateSingleProduct(product, portalTechnology, programState);
        translations.push(translation);
      }

      return {
        success: true,
        translations,
        summary: this.generateTranslationSummary(translations),
        recommendations: this.generateComplianceRecommendations(translations),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Translation Error:', error);
      return {
        success: false,
        error: error.message,
        fallbackTranslations: this.generateFallbackTranslations(productList, portalTechnology)
      };
    }
  }

  async translateSingleProduct(product, portalTechnology, programState) {
    const {
      name: originalName,
      description: originalDescription,
      category,
      price,
      ageRange,
      subjects
    } = product;

    // Get portal-specific terminology
    const portalTerms = this.portalTerminologies[portalTechnology] || this.portalTerminologies['Other'];
    const categoryTerms = portalTerms[category];

    if (!categoryTerms) {
      return this.generateUnknownCategoryTranslation(product, portalTechnology);
    }

    // AI-enhanced translation
    const aiTranslation = await this.generateAITranslation(product, portalTechnology, programState, categoryTerms);

    // Rule-based compliance scoring
    const complianceScore = this.calculateComplianceScore(originalDescription, categoryTerms);

    // Risk assessment
    const riskAssessment = this.assessComplianceRisk(originalDescription, originalName);

    // Generate multiple translation options
    const translationOptions = this.generateTranslationOptions(product, categoryTerms, aiTranslation);

    return {
      original: {
        name: originalName,
        description: originalDescription,
        category
      },
      recommended: translationOptions[0],
      alternatives: translationOptions.slice(1),
      compliance: {
        score: complianceScore,
        confidence: categoryTerms.confidence,
        riskLevel: riskAssessment.level,
        riskFactors: riskAssessment.factors
      },
      portalSpecific: {
        technology: portalTechnology,
        approvedTerms: categoryTerms.approved,
        requirements: categoryTerms.requirements,
        prohibitions: categoryTerms.prohibitions
      },
      recommendations: this.generateProductRecommendations(complianceScore, riskAssessment, categoryTerms)
    };
  }

  async generateAITranslation(product, portalTechnology, programState, categoryTerms) {
    try {
      const translationPrompt = `
        Translate this product for ESA program compliance:

        Original Product:
        Name: ${product.name}
        Description: ${product.description}
        Category: ${product.category}
        Age Range: ${product.ageRange || 'Not specified'}
        Subjects: ${product.subjects || 'Not specified'}

        Target Portal: ${portalTechnology} (${programState})
        Approved Category Terms: ${categoryTerms.approved.join(', ')}
        Primary Term: ${categoryTerms.primary}
        Requirements: ${categoryTerms.requirements.join(', ')}
        Prohibitions: ${categoryTerms.prohibitions.join(', ')}

        Provide ESA-compliant translation in JSON format:
        {
          "name": "ESA-compliant product name",
          "description": "ESA-compliant description emphasizing educational value",
          "esaCategory": "primary approved term",
          "complianceNotes": "key compliance considerations",
          "educationalObjectives": ["specific learning objectives"],
          "confidenceScore": 0.0-1.0
        }

        Focus on educational value, compliance requirements, and approved terminology.
      `;

      const completion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 800,
        temperature: 0.3,
        system: "You are an ESA program compliance expert specializing in product categorization and terminology. Always respond with valid JSON.",
        messages: [
          {
            role: "user",
            content: translationPrompt
          }
        ]
      });

      return JSON.parse(completion.content[0].text);

    } catch (error) {
      console.error('AI Translation Error:', error);
      return this.generateRuleBasedTranslation(product, categoryTerms);
    }
  }

  generateRuleBasedTranslation(product, categoryTerms) {
    // Fallback rule-based translation
    return {
      name: `Educational ${product.name}`,
      description: `Educational service: ${product.description}. Designed for individual student learning and academic progress.`,
      esaCategory: categoryTerms.primary,
      complianceNotes: 'Rule-based translation - manual review recommended',
      educationalObjectives: ['Academic skill development', 'Educational progress'],
      confidenceScore: 0.6
    };
  }

  calculateComplianceScore(description, categoryTerms) {
    let score = 0.5; // base score
    const lowercaseDesc = description.toLowerCase();

    // Check for high-risk terms
    const highRiskMatches = this.compliancePatterns.highRisk.filter(term => 
      lowercaseDesc.includes(term.toLowerCase())
    ).length;
    score -= highRiskMatches * 0.2;

    // Check for medium-risk terms
    const mediumRiskMatches = this.compliancePatterns.mediumRisk.filter(term =>
      lowercaseDesc.includes(term.toLowerCase())
    ).length;
    score -= mediumRiskMatches * 0.1;

    // Check for low-risk (positive) terms
    const lowRiskMatches = this.compliancePatterns.lowRisk.filter(term =>
      lowercaseDesc.includes(term.toLowerCase())
    ).length;
    score += lowRiskMatches * 0.1;

    // Check alignment with category requirements
    const requirementMatches = categoryTerms.requirements.filter(req =>
      lowercaseDesc.includes(req.toLowerCase())
    ).length;
    score += requirementMatches * 0.15;

    return Math.max(0, Math.min(1, score));
  }

  assessComplianceRisk(description, name) {
    const combined = `${name} ${description}`.toLowerCase();
    const risks = [];

    // High-risk patterns
    this.compliancePatterns.highRisk.forEach(pattern => {
      if (combined.includes(pattern.toLowerCase())) {
        risks.push({
          level: 'high',
          factor: pattern,
          description: `Contains potentially non-compliant term: "${pattern}"`
        });
      }
    });

    // Medium-risk patterns
    this.compliancePatterns.mediumRisk.forEach(pattern => {
      if (combined.includes(pattern.toLowerCase())) {
        risks.push({
          level: 'medium',
          factor: pattern,
          description: `May require clarification: "${pattern}"`
        });
      }
    });

    const highRiskCount = risks.filter(r => r.level === 'high').length;
    const mediumRiskCount = risks.filter(r => r.level === 'medium').length;

    let overallLevel = 'low';
    if (highRiskCount > 0) overallLevel = 'high';
    else if (mediumRiskCount > 1) overallLevel = 'medium';

    return {
      level: overallLevel,
      factors: risks,
      score: risks.length === 0 ? 0.9 : Math.max(0.1, 0.9 - (highRiskCount * 0.3 + mediumRiskCount * 0.1))
    };
  }

  generateTranslationOptions(product, categoryTerms, aiTranslation) {
    const options = [];

    // AI-generated option (if available)
    if (aiTranslation && aiTranslation.confidenceScore > 0.7) {
      options.push({
        name: aiTranslation.name,
        description: aiTranslation.description,
        esaCategory: aiTranslation.esaCategory,
        source: 'ai_optimized',
        confidence: aiTranslation.confidenceScore,
        objectives: aiTranslation.educationalObjectives
      });
    }

    // Conservative compliance option
    options.push({
      name: `Educational ${product.category} Service`,
      description: `Professional ${product.category.toLowerCase()} services designed for individual student academic progress and educational development.`,
      esaCategory: categoryTerms.primary,
      source: 'conservative_compliance',
      confidence: 0.85,
      objectives: ['Academic skill development', 'Educational progress tracking']
    });

    // Original with ESA terminology
    options.push({
      name: product.name,
      description: `${product.description} Provided as ${categoryTerms.primary} for educational advancement.`,
      esaCategory: categoryTerms.primary,
      source: 'minimal_modification',
      confidence: 0.7,
      objectives: ['Maintains original product identity', 'ESA terminology compliance']
    });

    return options.slice(0, 3); // Return top 3 options
  }

  generateProductRecommendations(complianceScore, riskAssessment, categoryTerms) {
    const recommendations = [];

    if (complianceScore < 0.6) {
      recommendations.push({
        priority: 'high',
        category: 'Compliance Enhancement',
        action: 'Revise product description to emphasize educational value and outcomes',
        rationale: `Low compliance score: ${(complianceScore * 100).toFixed(0)}%`
      });
    }

    if (riskAssessment.level === 'high') {
      recommendations.push({
        priority: 'critical',
        category: 'Risk Mitigation',
        action: 'Address high-risk terms before ESA application',
        rationale: `High-risk factors identified: ${riskAssessment.factors.filter(f => f.level === 'high').map(f => f.factor).join(', ')}`
      });
    }

    // Category-specific recommendations
    categoryTerms.requirements.forEach(req => {
      recommendations.push({
        priority: 'medium',
        category: 'Requirements Alignment',
        action: `Ensure product documentation demonstrates: ${req}`,
        rationale: 'Required by portal technology standards'
      });
    });

    return recommendations;
  }

  generateTranslationSummary(translations) {
    const totalProducts = translations.length;
    const highCompliance = translations.filter(t => t.compliance.score >= 0.8).length;
    const mediumCompliance = translations.filter(t => t.compliance.score >= 0.6 && t.compliance.score < 0.8).length;
    const lowCompliance = translations.filter(t => t.compliance.score < 0.6).length;
    
    const highRisk = translations.filter(t => t.compliance.riskLevel === 'high').length;
    const averageConfidence = translations.reduce((sum, t) => sum + t.compliance.confidence, 0) / totalProducts;

    return {
      totalProducts,
      complianceDistribution: {
        high: highCompliance,
        medium: mediumCompliance,
        low: lowCompliance
      },
      riskAssessment: {
        highRisk,
        percentage: Math.round((highRisk / totalProducts) * 100)
      },
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      recommendation: this.generateOverallRecommendation(highCompliance, lowCompliance, highRisk, totalProducts)
    };
  }

  generateOverallRecommendation(highCompliance, lowCompliance, highRisk, total) {
    const highComplianceRate = highCompliance / total;
    const lowComplianceRate = lowCompliance / total;
    const highRiskRate = highRisk / total;

    if (highComplianceRate >= 0.8 && highRiskRate <= 0.1) {
      return 'Excellent ESA readiness - proceed with confidence';
    } else if (highComplianceRate >= 0.6 && highRiskRate <= 0.2) {
      return 'Good ESA alignment - minor adjustments recommended';
    } else if (lowComplianceRate >= 0.4 || highRiskRate >= 0.3) {
      return 'Significant compliance work needed before ESA application';
    } else {
      return 'Moderate ESA readiness - focused improvements recommended';
    }
  }

  generateComplianceRecommendations(translations) {
    const recommendations = [];
    
    // Aggregate recommendations from individual translations
    const allRecommendations = translations.flatMap(t => t.recommendations);
    const criticalActions = allRecommendations.filter(r => r.priority === 'critical');
    const highActions = allRecommendations.filter(r => r.priority === 'high');

    if (criticalActions.length > 0) {
      recommendations.push({
        priority: 'immediate',
        category: 'Critical Compliance Issues',
        actions: criticalActions.map(a => a.action),
        impact: 'Required for ESA eligibility'
      });
    }

    if (highActions.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Compliance Enhancement',
        actions: highActions.slice(0, 3).map(a => a.action), // Top 3
        impact: 'Significantly improves approval chances'
      });
    }

    return recommendations;
  }

  generateUnknownCategoryTranslation(product, portalTechnology) {
    return {
      original: product,
      recommended: {
        name: product.name,
        description: product.description,
        esaCategory: 'Educational Services',
        source: 'unknown_category',
        confidence: 0.3
      },
      alternatives: [],
      compliance: {
        score: 0.3,
        confidence: 0.3,
        riskLevel: 'medium',
        riskFactors: [{
          level: 'medium',
          factor: 'unknown_category',
          description: 'Product category not recognized for ESA compliance mapping'
        }]
      },
      recommendations: [{
        priority: 'high',
        category: 'Category Clarification',
        action: 'Manual review required - category not in ESA compliance database',
        rationale: 'Unknown product category requires expert evaluation'
      }]
    };
  }

  generateFallbackTranslations(productList, portalTechnology) {
    return productList.map(product => ({
      original: product,
      fallback: {
        name: `Educational ${product.name}`,
        description: `Educational service: ${product.description}`,
        esaCategory: 'Educational Services',
        confidence: 0.5
      },
      note: 'Fallback translation - manual review recommended'
    }));
  }

  // Method to learn from approval/rejection patterns
  updateTranslationPatterns(translationId, approved, feedback) {
    // Future enhancement: Machine learning from approval patterns
    console.log(`Learning from translation ${translationId}: ${approved ? 'approved' : 'rejected'}`);
    if (feedback) {
      console.log(`Feedback: ${feedback}`);
    }
    
    return {
      success: true,
      message: 'Pattern learning logged for future improvement'
    };
  }

  // Method to validate translations against specific program requirements
  validateAgainstProgram(translation, programRequirements) {
    const validation = {
      passes: [],
      warnings: [],
      failures: []
    };

    // Check against program-specific requirements
    if (programRequirements.backgroundCheckRequired && !translation.recommended.description.includes('qualified')) {
      validation.warnings.push('Program requires background checks - emphasize instructor qualifications');
    }

    if (programRequirements.insuranceRequired) {
      validation.warnings.push('Program requires insurance - ensure coverage documentation');
    }

    return validation;
  }
}

export default ComplianceTranslator;