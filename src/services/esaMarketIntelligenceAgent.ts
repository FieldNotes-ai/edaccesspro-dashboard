import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ResearchTarget {
  id: string;
  name: string;
  state: string;
  portalTechnology: string;
  website?: string;
  contactInfo?: string;
  programInfo?: string;
  vendorInfo?: string;
  currentData: {
    platformFee?: number;
    adminFee?: number;
    marketSize?: number;
    paymentTiming?: string;
    vendorApprovalTime?: string;
  };
}

interface ResearchResult {
  programId: string;
  programName: string;
  confidence: number;
  findings: {
    platformFee?: {
      value: number;
      source: string;
      confidence: number;
      notes: string;
    };
    adminFee?: {
      value: number;
      source: string;
      confidence: number;
      notes: string;
    };
    marketSize?: {
      value: number;
      source: string;
      confidence: number;
      notes: string;
    };
    paymentTiming?: {
      value: string;
      source: string;
      confidence: number;
      notes: string;
    };
    vendorApprovalTime?: {
      value: string;
      source: string;
      confidence: number;
      notes: string;
    };
  };
  marketIntelligence: {
    competitiveAnalysis: string;
    marketTrends: string;
    opportunityAssessment: string;
    riskFactors: string[];
  };
  lastUpdated: string;
  researchSources: string[];
}

export class ESAMarketIntelligenceAgent {
  private baseId: string;
  private apiKey: string;

  constructor() {
    this.baseId = process.env.AIRTABLE_BASE_ID || 'appghnijKn2LFPbvP';
    this.apiKey = process.env.AIRTABLE_TOKEN || '';
  }

  /**
   * Main entry point for market research analysis
   * Identifies research priorities and executes research tasks
   */
  async executeResearchCycle(): Promise<{
    success: boolean;
    researchResults: ResearchResult[];
    qualityImprovements: {
      beforeScore: number;
      afterScore: number;
      fieldsImproved: string[];
    };
    error?: string;
  }> {
    try {
      console.log('🔬 Starting Market Research Agent cycle...');

      // 1. Identify research targets (programs with missing/incomplete data)
      const researchTargets = await this.identifyResearchTargets();
      console.log(`📋 Identified ${researchTargets.length} research targets`);

      // 2. Prioritize research based on data gaps and market importance
      const prioritizedTargets = this.prioritizeResearchTargets(researchTargets);
      console.log(`🎯 Prioritized top ${Math.min(5, prioritizedTargets.length)} targets for this cycle`);

      // 3. Execute research for top priority targets
      const researchResults: ResearchResult[] = [];
      const topTargets = prioritizedTargets.slice(0, 5); // Process top 5 per cycle

      for (const target of topTargets) {
        try {
          const result = await this.researchProgram(target);
          if (result) {
            researchResults.push(result);
            console.log(`✅ Completed research for ${target.name}`);
          }
        } catch (error) {
          console.error(`❌ Research failed for ${target.name}:`, error);
        }
      }

      // 4. Update Airtable with findings
      const updateResults = await this.updateAirtableWithFindings(researchResults);
      console.log(`📊 Updated ${updateResults.successCount} of ${researchResults.length} records`);

      // 5. Calculate quality improvements
      const qualityImprovements = await this.calculateQualityImprovements(researchResults);

      return {
        success: true,
        researchResults,
        qualityImprovements
      };

    } catch (error) {
      console.error('Market Research Agent error:', error);
      return {
        success: false,
        researchResults: [],
        qualityImprovements: {
          beforeScore: 0,
          afterScore: 0,
          fieldsImproved: []
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Identify programs that need research based on missing/incomplete data
   */
  private async identifyResearchTargets(): Promise<ResearchTarget[]> {
    try {
      const response = await fetch(`https://api.airtable.com/v0/${this.baseId}/ESA%20Program%20Tracker`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`);
      }

      const data = await response.json();
      const targets: ResearchTarget[] = [];

      data.records.forEach((record: any) => {
        const fields = record.fields;
        const hasDataGaps = this.hasDataGaps(fields);

        if (hasDataGaps) {
          targets.push({
            id: record.id,
            name: fields['Program Name'],
            state: fields['State'],
            portalTechnology: fields['Portal Technology'],
            website: fields['Program Website'],
            contactInfo: fields['Contact Info/Email'],
            programInfo: fields['Program Info'],
            vendorInfo: fields['Vendor Registration Info'],
            currentData: {
              platformFee: fields['Platform Fee'],
              adminFee: fields['Admin Fee'],
              marketSize: fields['Market Size'],
              paymentTiming: fields['Payment Timing'],
              vendorApprovalTime: fields['Vendor Approval Time']
            }
          });
        }
      });

      return targets;
    } catch (error) {
      console.error('Error identifying research targets:', error);
      return [];
    }
  }

  /**
   * Check if a program has significant data gaps requiring research
   */
  private hasDataGaps(fields: any): boolean {
    const criticalFields = [
      'Platform Fee',
      'Admin Fee',
      'Market Size',
      'Payment Timing',
      'Vendor Approval Time'
    ];

    let missingCount = 0;
    criticalFields.forEach(field => {
      if (!fields[field] || fields[field] === 0 || fields[field] === '') {
        missingCount++;
      }
    });

    return missingCount >= 2; // Consider it a gap if 2+ critical fields are missing
  }

  /**
   * Prioritize research targets based on market importance and data gap severity
   */
  private prioritizeResearchTargets(targets: ResearchTarget[]): ResearchTarget[] {
    return targets.sort((a, b) => {
      // Calculate priority score for each target
      const scoreA = this.calculateResearchPriority(a);
      const scoreB = this.calculateResearchPriority(b);
      return scoreB - scoreA; // Higher score = higher priority
    });
  }

  /**
   * Calculate research priority score based on multiple factors
   */
  private calculateResearchPriority(target: ResearchTarget): number {
    let score = 0;

    // Market size factor (larger states = higher priority)
    const marketSizeFactor = this.getMarketSizeFactor(target.state);
    score += marketSizeFactor * 30;

    // Data gap severity (more missing fields = higher priority)
    const dataGapSeverity = this.calculateDataGapSeverity(target.currentData);
    score += dataGapSeverity * 25;

    // Portal technology factor (some portals have more standardized fee structures)
    const portalFactor = this.getPortalResearchFactor(target.portalTechnology);
    score += portalFactor * 20;

    // Information availability (more existing info = easier research)
    const infoAvailability = this.assessInformationAvailability(target);
    score += infoAvailability * 15;

    // Recency factor (older data = higher priority for refresh)
    score += 10; // Base recency score

    return score;
  }

  private getMarketSizeFactor(state: string): number {
    const marketSizes = {
      'Florida': 1.0,
      'Arizona': 0.8,
      'Texas': 0.9,
      'Utah': 0.5,
      'Louisiana': 0.4,
      'West Virginia': 0.3
    };
    return marketSizes[state] || 0.3;
  }

  private calculateDataGapSeverity(currentData: any): number {
    const fields = ['platformFee', 'adminFee', 'marketSize', 'paymentTiming', 'vendorApprovalTime'];
    const missingFields = fields.filter(field => !currentData[field] || currentData[field] === 0);
    return missingFields.length / fields.length; // 0-1 score
  }

  private getPortalResearchFactor(portalTechnology: string): number {
    const researchFactors = {
      'ClassWallet': 0.9, // Well-documented fee structure
      'Odyssey': 0.8, // Standardized across programs
      'Step Up For Students': 0.7, // Varies by program
      'Other': 0.5, // Manual systems, harder to research
      'Manual': 0.4
    };
    return researchFactors[portalTechnology] || 0.5;
  }

  private assessInformationAvailability(target: ResearchTarget): number {
    let score = 0;
    if (target.website) score += 0.3;
    if (target.contactInfo) score += 0.2;
    if (target.programInfo && target.programInfo.length > 100) score += 0.3;
    if (target.vendorInfo && target.vendorInfo.length > 50) score += 0.2;
    return score;
  }

  /**
   * Execute comprehensive research for a specific program
   */
  private async researchProgram(target: ResearchTarget): Promise<ResearchResult | null> {
    try {
      console.log(`🔍 Researching ${target.name} (${target.state})...`);

      const researchPrompt = this.buildResearchPrompt(target);
      
      const completion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        temperature: 0.3,
        system: `You are a specialized financial analyst for ESA (Education Savings Account) programs. 
        Your primary goal is to extract precise fee structures and operational data from program documentation.
        
        PRIORITY DATA TO EXTRACT:
        1. Platform/Technology fees (0-3% charged by ClassWallet, Odyssey, Step Up, etc.)
        2. Administrative/Management fees (0-5% charged by state agencies or managing organizations)
        3. Processing fees, transaction fees, service fees
        4. Market size indicators (enrollment numbers, eligible students, participants)
        5. Payment and approval timelines
        
        FEE DETECTION STRATEGIES:
        - Look for percentage symbols (%) near fee-related keywords
        - Search for "no fee", "fee-free", "zero fee" indicating 0% fees  
        - Check vendor onboarding documents for fee disclosures
        - Analyze technology provider contracts and fee schedules
        - Look for cost structures in program budgets or financial documents
        
        CONFIDENCE ASSESSMENT:
        - HIGH (0.9): Explicit fee percentages or "no fee" statements
        - MEDIUM (0.6): Inferred from context or similar program structures
        - LOW (0.3): Estimated based on limited information
        
        CRITICAL: Even if no explicit fees are mentioned, state "0% fee" with medium confidence if documentation suggests fee-free operation.`,
        messages: [
          {
            role: "user",
            content: researchPrompt
          }
        ]
      });

      const aiResponse = (completion.content[0] as any).text;
      const parsedResult = this.parseResearchResponse(aiResponse, target);

      return {
        programId: target.id,
        programName: target.name,
        confidence: this.calculateOverallConfidence(parsedResult.findings),
        findings: parsedResult.findings,
        marketIntelligence: parsedResult.marketIntelligence,
        lastUpdated: new Date().toISOString(),
        researchSources: parsedResult.sources
      };

    } catch (error) {
      console.error(`Research error for ${target.name}:`, error);
      return null;
    }
  }

  /**
   * Build comprehensive research prompt for AI analysis
   */
  private buildResearchPrompt(target: ResearchTarget): string {
    return `
Analyze this ESA program and extract missing fee/operational data:

PROGRAM: ${target.name}
STATE: ${target.state}
PORTAL TECHNOLOGY: ${target.portalTechnology}

EXISTING INFORMATION:
${target.programInfo || 'No program info available'}

VENDOR REGISTRATION INFO:
${target.vendorInfo || 'No vendor info available'}

CURRENT DATA GAPS (what we need to research):
${this.formatDataGaps(target.currentData)}

FEE RESEARCH OBJECTIVES (TOP PRIORITY):
1. Platform Fee: What percentage does ${target.portalTechnology} charge vendors? Look for technology fees, processing fees, transaction fees.
2. Administrative Fee: What percentage does the state/managing organization charge? Look for management fees, operational fees, program fees.
3. Market Size: Current enrollment or eligible student count for vendor market sizing.
4. Payment Timing: How quickly are vendors reimbursed or paid?
5. Vendor Approval: Timeline for vendor registration and approval process.

**CRITICAL FEE ANALYSIS REQUIRED:**

PLATFORM FEE RESEARCH:
- Search for explicit fee percentages charged by ${target.portalTechnology}
- Look for "no platform fee", "fee-free platform", "zero processing fee"  
- Check if technology costs are covered by state vs. charged to vendors
- Analyze any vendor agreements or fee schedules mentioned
- If no explicit fees found, infer based on program structure (state-funded platforms typically 0%, private platforms 1-3%)

ADMINISTRATIVE FEE RESEARCH:
- Search for state agency management fees or operational costs charged to vendors
- Look for "administrative fee", "management fee", "program fee", "operational fee"
- Check if program administration costs are covered by state appropriations vs. vendor fees
- Analyze program budgets for revenue sources (state funds vs. vendor fees)
- If no explicit fees found, infer based on funding model (state-appropriated typically 0%, self-sustaining may charge 1-5%)

**RESPONSE FORMAT:**
For each fee type, provide:
- Exact percentage if found (e.g., "2.5%")
- "0%" if explicitly stated as fee-free or inferred from state funding
- Confidence level (0.9 for explicit, 0.6 for inferred, 0.3 for estimated)
- Source reasoning and specific text references

**MARKET SIZE & OPERATIONS:**
- Current student enrollment numbers
- Payment processing timelines  
- Vendor approval procedures and timeframes

Provide clear, structured findings that can be parsed programmatically with specific percentages and confidence scores.
`;
  }

  private formatDataGaps(currentData: any): string {
    const gaps = [];
    if (!currentData.platformFee) gaps.push('- Platform Fee: Unknown');
    if (!currentData.adminFee) gaps.push('- Admin Fee: Unknown'); 
    if (!currentData.marketSize) gaps.push('- Market Size: Unknown');
    if (!currentData.paymentTiming) gaps.push('- Payment Timing: Unknown');
    if (!currentData.vendorApprovalTime) gaps.push('- Vendor Approval Time: Unknown');
    return gaps.join('\n');
  }

  /**
   * Parse AI research response into structured data
   */
  private parseResearchResponse(aiResponse: string, target: ResearchTarget): {
    findings: any;
    marketIntelligence: any;
    sources: string[];
  } {
    const findings = {};
    const marketIntelligence = {
      competitiveAnalysis: '',
      marketTrends: '',
      opportunityAssessment: '',
      riskFactors: []
    };
    const sources = ['AI Analysis of Program Documentation'];

    // Use pattern matching and AI-assisted parsing to extract structured data
    // This is a simplified version - in production, you'd want more robust parsing
    try {
      const patterns = {
        platformFee: /(?:platform|technology|portal|processing|transaction|service provider)\s*fee.*?(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%.*?(?:platform|technology|portal|processing)|(?:no|zero|0)\s*(?:platform|technology|portal|processing)\s*fee/i,
        adminFee: /(?:admin(?:istrative)?|management|administrative|state|program|operation(?:al)?)\s*fee.*?(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%.*?(?:admin|management|administrative|state|program)|(?:no|zero|0)\s*(?:admin|management|administrative|state|program)\s*fee/i,
        marketSize: /(\d+(?:,\d+)*)\s*(?:students?|enrollments?|participants?|families|accounts?|recipients?)|(?:serving|enrolled|participating|eligible).*?(\d+(?:,\d+)*)/i,
        paymentTiming: /(?:payment|reimbursement|disbursement).*?(?:timing|schedule|frequency|process).*?(immediate|daily|weekly|monthly|quarterly|\d+-\d+\s*(?:days?|weeks?|months?))|(?:immediate|daily|weekly|monthly|quarterly|\d+-\d+\s*(?:days?|weeks?|months?)).*?(?:payment|reimbursement|processing)/i,
        vendorApprovalTime: /(?:vendor|provider|merchant)\s*(?:approval|registration|onboarding|application).*?(\d+-\d+\s*(?:weeks?|days?|months?))|(?:approval|registration|onboarding)\s*(?:process|timeline|timeframe).*?(\d+-\d+\s*(?:weeks?|days?|months?))/i
      };

      Object.entries(patterns).forEach(([field, pattern]) => {
        const match = aiResponse.match(pattern);
        if (match) {
          let value;
          
          if (field.includes('Fee')) {
            // Check if it's a "no fee" pattern
            if (match[0].toLowerCase().includes('no ') || match[0].toLowerCase().includes('zero') || match[0].toLowerCase().includes('0 ')) {
              value = 0;
            } else {
              // Handle multiple capture groups for fee patterns
              value = parseFloat(match[1] || match[2]);
            }
          } else if (field === 'marketSize') {
            // Handle multiple capture groups for market size
            const numStr = (match[1] || match[2]).replace(/,/g, '');
            value = parseInt(numStr);
          } else {
            // Handle timing patterns
            value = match[1] || match[2];
          }

          if ((value !== undefined && !isNaN(value)) || (field.includes('Fee') && value === 0)) {
            findings[field] = {
              value,
              source: 'Enhanced pattern analysis',
              confidence: this.assessFieldConfidence(aiResponse, field),
              notes: `Extracted via enhanced AI analysis: ${match[0]}`
            };
          }
        }
      });

      // Extract market intelligence sections
      marketIntelligence.competitiveAnalysis = this.extractSection(aiResponse, 'competitive|competition');
      marketIntelligence.marketTrends = this.extractSection(aiResponse, 'trends|growth|market');
      marketIntelligence.opportunityAssessment = this.extractSection(aiResponse, 'opportunity|potential');
      marketIntelligence.riskFactors = this.extractRiskFactors(aiResponse);

    } catch (error) {
      console.error('Error parsing research response:', error);
    }

    return { findings, marketIntelligence, sources };
  }

  private assessFieldConfidence(response: string, field: string): number {
    const confidenceMarkers = {
      high: /high confidence|clearly states|explicitly mentions|documented/i,
      medium: /likely|appears|suggests|indicates|based on/i,
      low: /uncertain|unclear|estimated|approximately|assumed/i
    };

    const fieldContext = this.extractFieldContext(response, field);
    
    if (confidenceMarkers.high.test(fieldContext)) return 0.9;
    if (confidenceMarkers.medium.test(fieldContext)) return 0.6;
    if (confidenceMarkers.low.test(fieldContext)) return 0.3;
    
    return 0.5; // Default medium confidence
  }

  private extractFieldContext(response: string, field: string): string {
    const lines = response.split('\n');
    const relevantLines = lines.filter(line => 
      line.toLowerCase().includes(field.toLowerCase()) ||
      line.toLowerCase().includes(field.replace(/([A-Z])/g, ' $1').toLowerCase())
    );
    return relevantLines.join(' ');
  }

  private extractSection(response: string, keywords: string): string {
    const regex = new RegExp(`.*(?:${keywords}).*`, 'gi');
    const matches = response.match(regex);
    return matches ? matches.join(' ').substring(0, 500) : '';
  }

  private extractRiskFactors(response: string): string[] {
    const riskPatterns = /(?:risk|challenge|concern|issue|problem).*?(?:\.|$)/gi;
    const matches = response.match(riskPatterns);
    return matches ? matches.slice(0, 5).map(m => m.trim()) : [];
  }

  private calculateOverallConfidence(findings: any): number {
    const confidenceValues = Object.values(findings)
      .map((finding: any) => finding.confidence || 0.5);
    
    if (confidenceValues.length === 0) return 0;
    
    return confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
  }

  /**
   * Update Airtable with research findings
   */
  private async updateAirtableWithFindings(results: ResearchResult[]): Promise<{
    successCount: number;
    errorCount: number;
    errors: string[];
  }> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const result of results) {
      try {
        const updateFields = this.prepareAirtableUpdateFields(result);
        
        if (Object.keys(updateFields).length === 0) {
          continue; // No updates needed
        }

        const response = await fetch(
          `https://api.airtable.com/v0/${this.baseId}/ESA%20Program%20Tracker/${result.programId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: updateFields
            })
          }
        );

        if (response.ok) {
          successCount++;
          console.log(`✅ Updated ${result.programName} with ${Object.keys(updateFields).length} fields`);
        } else {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to update ${result.programName}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { successCount, errorCount, errors };
  }

  /**
   * Prepare Airtable field updates from research findings
   */
  private prepareAirtableUpdateFields(result: ResearchResult): any {
    const updateFields: any = {};

    // Only update fields with high confidence and valid data
    Object.entries(result.findings).forEach(([fieldName, finding]: [string, any]) => {
      if (finding.confidence >= 0.6 && finding.value !== null && finding.value !== undefined) {
        const airtableFieldName = this.mapToAirtableFieldName(fieldName);
        updateFields[airtableFieldName] = finding.value;
      }
    });

    // Add research metadata
    updateFields['Last Research Update'] = result.lastUpdated;
    updateFields['Research Confidence'] = Math.round(result.confidence * 100);
    updateFields['Market Intelligence'] = this.formatMarketIntelligence(result.marketIntelligence);

    return updateFields;
  }

  private mapToAirtableFieldName(fieldName: string): string {
    const mapping = {
      'platformFee': 'Platform Fee',
      'adminFee': 'Admin Fee',
      'marketSize': 'Market Size',
      'paymentTiming': 'Payment Timing',
      'vendorApprovalTime': 'Vendor Approval Time'
    };
    return mapping[fieldName] || fieldName;
  }

  private formatMarketIntelligence(intelligence: any): string {
    return `
Competitive Analysis: ${intelligence.competitiveAnalysis || 'N/A'}

Market Trends: ${intelligence.marketTrends || 'N/A'}

Opportunity Assessment: ${intelligence.opportunityAssessment || 'N/A'}

Risk Factors: ${intelligence.riskFactors.join('; ') || 'N/A'}
    `.trim();
  }

  /**
   * Calculate quality improvements from research cycle
   */
  private async calculateQualityImprovements(results: ResearchResult[]): Promise<{
    beforeScore: number;
    afterScore: number;
    fieldsImproved: string[];
  }> {
    // Simulate improvement calculation - in production, you'd call the health endpoint
    const fieldsImproved = results.flatMap(result => 
      Object.keys(result.findings).map(field => this.mapToAirtableFieldName(field))
    );

    return {
      beforeScore: 69, // Current score from health endpoint
      afterScore: Math.min(95, 69 + (fieldsImproved.length * 2)), // Estimate improvement
      fieldsImproved: Array.from(new Set(fieldsImproved)) // Deduplicate
    };
  }

  /**
   * Get research agent status for monitoring
   */
  async getResearchStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    lastRun: string;
    totalResearched: number;
    pendingTargets: number;
    avgConfidence: number;
  }> {
    try {
      const targets = await this.identifyResearchTargets();
      
      return {
        status: 'healthy',
        lastRun: new Date().toISOString(),
        totalResearched: 0, // Would track in database
        pendingTargets: targets.length,
        avgConfidence: 0.75 // Would calculate from actual data
      };
    } catch (error) {
      return {
        status: 'error',
        lastRun: new Date().toISOString(),
        totalResearched: 0,
        pendingTargets: 0,
        avgConfidence: 0
      };
    }
  }
}

export default ESAMarketIntelligenceAgent;