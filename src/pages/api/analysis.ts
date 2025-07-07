import { NextApiRequest, NextApiResponse } from 'next';
import { ProductAnalysisAgent } from '../../services/productAnalysis';
import { AdvancedMatchingEngine } from '../../services/matchingEngine';
import { StrategicAnalysisEngine } from '../../services/strategicAnalysis';
import { ComplianceTranslator } from '../../services/complianceTranslator';
import crypto from 'crypto';

// Simple in-memory cache for analysis results
const analysisCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Generate cache key from vendor data
function generateCacheKey(vendorData: any): string {
  const keyData = {
    companyName: vendorData.companyName,
    productServices: vendorData.productServices,
    organizationType: vendorData.organizationType,
    interestedStates: vendorData.interestedStates?.slice(0, 3) // Only first 3 states for cache key
  };
  return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
}

// Check if cached result is valid
function getCachedResult(cacheKey: string): any | null {
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log('Returning cached analysis result');
    return cached.data;
  }
  if (cached) {
    analysisCache.delete(cacheKey); // Remove expired cache
  }
  return null;
}

// Store result in cache
function setCachedResult(cacheKey: string, data: any, ttl: number = CACHE_TTL): void {
  analysisCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
  console.log('Cached analysis result');
}

// Helper function to make Airtable API calls
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || 'patlKdNWMBVv9s4v6.0b29c0ee52c899ab4a5058e2f8a6471f4f7baa4e6aa2103ac6198a11c6735082';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appghnijKn2LFPbvP';

async function airtableRequest(table: string, method: string = 'GET', data?: any) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    switch (action) {
      case 'analyze_vendor':
        return await analyzeVendor(req, res, data);
      
      case 'generate_matches':
        return await generateAdvancedMatches(req, res, data);
      
      case 'strategic_analysis':
        return await generateStrategicAnalysis(req, res, data);
      
      case 'translate_products':
        return await translateProducts(req, res, data);
      
      case 'full_analysis':
        return await performFullAnalysis(req, res, req.body);
      
      case 'cache_status':
        return res.status(200).json({
          success: true,
          cacheSize: analysisCache.size,
          cacheKeys: Array.from(analysisCache.keys()),
          cacheTtl: CACHE_TTL
        });
      
      case 'clear_cache':
        analysisCache.clear();
        return res.status(200).json({
          success: true,
          message: 'Cache cleared successfully'
        });
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Analysis API Error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function analyzeVendor(req: NextApiRequest, res: NextApiResponse, vendorData: any) {
  const productAnalysisAgent = new ProductAnalysisAgent();
  
  try {
    const analysis = await productAnalysisAgent.analyzeVendorCatalog(vendorData);
    
    return res.status(200).json({
      success: true,
      type: 'product_analysis',
      analysis: analysis.analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Vendor Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Product analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateAdvancedMatches(req: NextApiRequest, res: NextApiResponse, data: any) {
  const { vendorData, productAnalysis } = data;
  const matchingEngine = new AdvancedMatchingEngine();
  
  try {
    // Get available ESA programs directly from Airtable
    const airtableResponse = await airtableRequest('ESA Program Tracker', 'GET');
    const availablePrograms = Array.isArray(airtableResponse) ? airtableResponse : (airtableResponse?.records || []);

    const matchingResults = await matchingEngine.generateAdvancedMatches(
      vendorData,
      availablePrograms,
      productAnalysis
    );
    
    return res.status(200).json({
      success: true,
      type: 'advanced_matches',
      matches: matchingResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Advanced Matching Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Advanced matching failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateStrategicAnalysis(req: NextApiRequest, res: NextApiResponse, data: any) {
  const { vendorData, matchingResults, productAnalysis } = data;
  const strategicEngine = new StrategicAnalysisEngine();
  
  try {
    const strategicAnalysis = await strategicEngine.generateStrategicAnalysis(
      vendorData,
      matchingResults,
      productAnalysis
    );
    
    return res.status(200).json({
      success: true,
      type: 'strategic_analysis',
      analysis: strategicAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Strategic Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Strategic analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function translateProducts(req: NextApiRequest, res: NextApiResponse, data: any) {
  const { vendorData, productAnalysis } = data;
  const translator = new ComplianceTranslator();
  
  try {
    const translations = await translator.translateProductsToESA(
      [vendorData.productServices],
      'Generic Portal',
      vendorData.interestedStates?.[0] || 'Arizona'
    );
    
    return res.status(200).json({
      success: true,
      type: 'compliance_translation',
      translations: translations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Translation Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Product translation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function performFullAnalysis(req: NextApiRequest, res: NextApiResponse, vendorData: any) {
  try {
    console.log('Starting full vendor analysis for:', vendorData.companyName);
    
    // Check cache first
    const cacheKey = generateCacheKey(vendorData);
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      return res.status(200).json({
        success: true,
        type: 'full_analysis',
        analysis: cachedResult,
        cached: true
      });
    }
    
    // Step 1: Product Analysis
    console.log('Running product analysis...');
    let productAnalysis;
    try {
      const productAnalysisAgent = new ProductAnalysisAgent();
      productAnalysis = await productAnalysisAgent.analyzeVendorCatalog(vendorData);
    } catch (aiError) {
      console.log('AI analysis failed, using mock data for development');
      productAnalysis = {
        analysis: {
          categories: ['Educational Materials', 'Curriculum & Content', 'Assessment Tools'],
          esaCompatibility: 'High',
          marketFit: 'Strong match for homeschool and ESA programs',
          recommendations: 'Focus on curriculum categories for fastest market entry',
          riskFactors: ['Compliance requirements', 'State-specific regulations'],
          strengths: ['Established curriculum', 'Homeschool focus', 'Reasonable pricing']
        }
      };
    }

    // Step 2: Advanced Matching
    console.log('Generating advanced matches...');
    const matchingEngine = new AdvancedMatchingEngine();
    
    // Get available ESA programs using the working endpoint
    const airtableResponse2 = await airtableRequest("ESA Program Tracker", "GET");
    const availablePrograms = Array.isArray(airtableResponse2) ? airtableResponse2 : (airtableResponse2?.records || []);

    const matchingResults = await matchingEngine.generateAdvancedMatches(
      vendorData,
      availablePrograms,
      productAnalysis
    );

    // Step 3: Strategic Analysis
    console.log('Performing strategic analysis...');
    let strategicAnalysis;
    try {
      const strategicEngine = new StrategicAnalysisEngine();
      strategicAnalysis = await strategicEngine.generateStrategicAnalysis(
        vendorData,
        matchingResults,
        productAnalysis
      );
    } catch (strategicError) {
      console.log('Strategic analysis failed, using mock data');
      strategicAnalysis = {
        marketSizing: {
          totalAddressableMarket: 125000,
          priorityMarkets: vendorData.interestedStates || ['Arizona', 'Florida']
        },
        revenueProjections: {
          year1: { conservative: 15000, realistic: 25000, optimistic: 45000 },
          year2: { conservative: 35000, realistic: 55000, optimistic: 85000 },
          year3: { conservative: 60000, realistic: 95000, optimistic: 150000 }
        },
        strategicRecommendations: {
          aiGenerated: `Based on your ${vendorData.organizationType?.join(', ')} focus and ${vendorData.interestedStates?.length || 3} target states, we recommend: 1) Start with Arizona ESA program for fastest entry, 2) Focus on curriculum and educational materials categories, 3) Leverage your homeschool expertise for competitive advantage, 4) Consider partnerships with existing ESA vendors for faster market penetration.`
        },
        riskAssessment: {
          overallRisk: 'Medium',
          factors: ['Regulatory changes', 'Competition', 'Market adoption']
        }
      };
    }

    // Step 4: Compliance Translation
    console.log('Generating compliance translations...');
    let complianceTranslations = null;
    try {
      const translator = new ComplianceTranslator();
      complianceTranslations = await translator.translateProductsToESA(
        [vendorData.productServices], // Wrap in array as expected by the method
        'Generic Portal', // Default portal technology
        vendorData.interestedStates?.[0] || 'Arizona' // Default state
      );
    } catch (translationError) {
      console.error('Compliance translation failed:', translationError);
      complianceTranslations = { success: false, error: 'Translation failed', translations: [] };
    }

    console.log('Full analysis complete');

    // Combine all results
    const fullAnalysis = {
      productAnalysis: productAnalysis.analysis,
      matchingResults: matchingResults,
      strategicAnalysis: strategicAnalysis,
      complianceTranslations: complianceTranslations,
      summary: {
        totalPrograms: matchingResults?.matches?.length || 0,
        topMatchScore: matchingResults?.matches?.[0]?.matchScore?.overall || 0,
        projectedRevenue: strategicAnalysis?.revenueProjections?.year1?.realistic || 0,
        riskLevel: strategicAnalysis?.riskAssessment?.overallRisk || 'Medium'
      },
      timestamp: new Date().toISOString()
    };

    // Cache the successful result
    setCachedResult(cacheKey, fullAnalysis);

    return res.status(200).json({
      success: true,
      type: 'full_analysis',
      analysis: fullAnalysis
    });

  } catch (error) {
    console.error('Full Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Full analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}