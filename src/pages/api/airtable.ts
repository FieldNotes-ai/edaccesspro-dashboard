import { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || 'patlKdNWMBVv9s4v6.0b29c0ee52c899ab4a5058e2f8a6471f4f7baa4e6aa2103ac6198a11c6735082';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appghnijKn2LFPbvP';

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

// Helper function to make Airtable API calls
async function airtableRequest(table: string, method: string = 'GET', data?: any) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  };

  if (data && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Airtable API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorBody
      });
      throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid Airtable response structure:', data);
      throw new Error('Invalid response structure from Airtable');
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Airtable API took too long to respond');
    }
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { table, action } = req.query;

      switch (action) {
        case 'enhanced-programs':
        case 'programs':
          // Get ESA programs with enhanced operational intelligence
          const programsData = await airtableRequest('ESA Program Tracker');
          const allPrograms = programsData.records.map((record: AirtableRecord) => ({
            id: record.id,
            name: record.fields['Program Name'],
            state: record.fields['State'],
            portalTechnology: record.fields['Portal Technology'],
            portalUrl: record.fields['Vendor Portal URL'],
            programType: record.fields['Program Type'],
            status: record.fields['Program Status'],
            dataFreshness: record.fields['Data Freshness Score'],
            vendorInfo: record.fields['Vendor Registration Info'],
            programInfo: record.fields['Program Info'],
            website: record.fields['Program Website'],
            contactInfo: record.fields['Contact Info/Email'],
            // Enhanced operational intelligence fields
            backgroundCheckRequired: record.fields['Background Check Required'] || false,
            insuranceRequired: record.fields['Insurance Required'] || false,
            insuranceMinimum: record.fields['Insurance Minimum'] || 0,
            renewalRequired: record.fields['Renewal Required'] || false,
            renewalFrequency: record.fields['Renewal Frequency'] || 'Never',
            requiredDocuments: record.fields['Required Documents'] || '',
            documentUpload: record.fields['Document Upload'] || '',
            submissionMethod: record.fields['Submission Method'] || '',
            vendorPaymentMethod: record.fields['Vendor Payment Method'] || '',
            priceParity: record.fields['Price Parity Required'] || false,
            currentWindowStatus: record.fields['Current Window Status'] || '',
            annualAmount: record.fields['Annual Amount Available'] || '',
            eligibleProducts: record.fields['Eligible Products'] || '',
            currentMarketSize: record.fields['Current Market Size'] || 0,
            // Additional critical fields for inventory mapping
            managingOrgs: record.fields['Managing Org(s)'] || '',
            allowedVendorTypes: record.fields['Allowed Vendor Types'] || '',
            vendorInsights: record.fields['Vendor Insights'] || '',
            internalNotes: record.fields['Internal Notes'] || '',
            // New vendor count and fee fields
            activeProductVendors: record.fields['Active Product Vendors'] || 0,
            activeServiceVendors: record.fields['Active Service Vendors'] || 0,
            platformFee: record.fields['Platform Fee'] || 0,
            adminFee: record.fields['Admin Fee'] || 0,
            // New market and timing fields
            marketSize: record.fields['Market Size'] || 0,
            paymentTiming: record.fields['Payment Timing'] || 'Unknown',
            vendorApprovalTime: record.fields['Vendor Approval Time'] || 'Unknown',
          }));

          // Filter ESA and ESA-like programs (vendors can sell directly to these)
          const esaPrograms = allPrograms.filter(program => 
            program.programType && (
              program.programType.includes('ESA') || 
              program.programType.includes('ESA-like')
            )
          );

          // Filter tax credit and voucher programs (supplementary intelligence only)
          const supplementaryPrograms = allPrograms.filter(program => 
            program.programType && (
              program.programType.includes('Tax Credit') || 
              program.programType.includes('Voucher')
            )
          );
          
          return res.status(200).json({ 
            programs: esaPrograms,
            supplementaryPrograms: supplementaryPrograms,
            totalPrograms: allPrograms.length
          });

        case 'esa-programs-active':
          // Get only active ESA/ESA-like programs for onboarding
          const esaOnlyData = await airtableRequest('ESA Program Tracker');
          const activeEsaPrograms = esaOnlyData.records
            .map((record: AirtableRecord) => ({
              id: record.id,
              name: record.fields['Program Name'],
              state: record.fields['State'],
              portalTechnology: record.fields['Portal Technology'],
              portalUrl: record.fields['Vendor Portal URL'],
              programType: record.fields['Program Type'],
              status: record.fields['Program Status'],
            }))
            .filter(program => 
              // Only ESA and ESA-like programs
              program.programType && (
                program.programType.includes('ESA') || 
                program.programType.includes('ESA-like')
              ) &&
              // Only active programs
              program.status === 'Active'
            );
          
          return res.status(200).json({ 
            programs: activeEsaPrograms,
            totalPrograms: activeEsaPrograms.length
          });

        case 'organizations':
          // Get organizations (vendors)
          const orgsData = await airtableRequest('Organizations');
          const organizations = orgsData.records.map((record: AirtableRecord) => ({
            id: record.id,
            name: record.fields['Organization Name'],
            primaryContact: record.fields['Primary Contact Name'],
            email: record.fields['Primary Contact Email'],
            status: record.fields['Status'],
            organizationType: record.fields['Organization Type'],
            dateCreated: record.fields['Date Created'],
            subscriptions: record.fields['Subscriptions'],
            userAccounts: record.fields['User Accounts'],
            programAccess: record.fields['Client Program Access'],
          }));
          
          return res.status(200).json({ organizations });

        case 'subscriptions':
          // Get subscription tiers
          const subsData = await airtableRequest('Subscriptions');
          const subscriptions = subsData.records.map((record: AirtableRecord) => ({
            id: record.id,
            tier: record.fields['Subscription Tier'],
            tierType: record.fields['Tier Type'],
            status: record.fields['Status'],
            monthlyPrice: record.fields['Monthly Price'],
            organization: record.fields['Organization'],
            startDate: record.fields['Start Date'],
          }));
          
          return res.status(200).json({ subscriptions });
          
        case 'user-subscription':
          // Get current user's subscription info
          // For demo purposes, return Enterprise tier
          return res.status(200).json({
            tier: 'Enterprise',
            features: [
              'operational-intelligence',
              'detailed-analytics', 
              'data-export',
              'advanced-filtering',
              'table-view',
              'unlimited-programs'
            ]
          });

        case 'analyze-fields':
          // Get detailed field analysis for inventory mapping
          const fieldAnalysisData = await airtableRequest('ESA Program Tracker');
          const fieldAnalysis = fieldAnalysisData.records.map((record: AirtableRecord) => ({
            id: record.id,
            name: record.fields['Program Name'],
            state: record.fields['State'],
            portalTechnology: record.fields['Portal Technology'],
            managingOrgs: record.fields['Managing Org(s)'],
            annualAmount: record.fields['Annual Amount Available'],
            vendorPaymentMethod: record.fields['Vendor Payment Method'],
            eligibleProducts: record.fields['Eligible Products'],
            allowedVendorTypes: record.fields['Allowed Vendor Types'],
            programInfo: record.fields['Program Info'],
            vendorInfo: record.fields['Vendor Registration Info'],
            vendorInsights: record.fields['Vendor Insights'],
            internalNotes: record.fields['Internal Notes'],
            dataFreshness: record.fields['Data Freshness Score'],
          }));
          
          return res.status(200).json({ analysis: fieldAnalysis });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'POST') {
      const { action, data } = req.body;

      switch (action) {
        case 'update_market_size':
          // Update Current Market Size field for all programs
          const { updates } = data;
          const updateResults = [];
          
          for (const update of updates) {
            try {
              const updateData = {
                fields: {
                  'Current Market Size': update.marketSize.toString()
                }
              };
              
              const result = await airtableRequest(`ESA Program Tracker/${update.recordId}`, 'PATCH', updateData);
              updateResults.push({ recordId: update.recordId, success: true, result });
              console.log(`✅ Updated market size for ${update.recordId}: ${update.marketSize}`);
            } catch (error) {
              updateResults.push({ recordId: update.recordId, success: false, error: error.message });
              console.error(`❌ Failed to update ${update.recordId}:`, error);
            }
          }
          
          return res.status(200).json({
            success: true,
            message: `Updated ${updateResults.filter(r => r.success).length} of ${updates.length} records`,
            results: updateResults
          });

        case 'create_vendor':
          // Create new vendor organization
          const orgFields: any = {
            'Organization Name': data.companyName,
            'Primary Contact Name': data.contactName,
            'Primary Contact Email': data.email,
            'Status': 'Active',
            'Date Created': new Date().toISOString().split('T')[0],
            'Onboarding Status': 'In Progress',
            'Signup Date': new Date().toISOString(),
            'Last Activity': new Date().toISOString(),
            'Notes': `Created via EdAccessPro dashboard. Interested States: ${data.interestedStates?.join(', ') || 'TBD'}. Goals: ${data.primaryGoals?.join(', ') || 'TBD'}. Challenge: ${data.biggestChallenge || 'None specified'}.`,
          };

          // Only add optional fields if they have values
          if (data.phone) orgFields['Phone'] = data.phone;
          if (data.servicesUrl) orgFields['Website'] = data.servicesUrl;
          if (data.organizationType && Array.isArray(data.organizationType) && data.organizationType.length > 0) {
            orgFields['Organization Type'] = data.organizationType;
          }
          // Skip Team Size for now since it has limited options

          const newOrgData = {
            fields: orgFields
          };

          const orgResult = await airtableRequest('Organizations', 'POST', newOrgData);
          console.log('✅ Organization created:', orgResult.id);
          
          // Create subscription record - map tiers to current Airtable format
          let subResult = null;
          try {
            const tierMapping = {
              'free': 'Free ($0)',
              'starter': 'Starter ($99)', 
              'professional': 'Professional ($299)',
              'enterprise': 'Enterprise ($999)'
            };
            
            const mappedTier = tierMapping[data.selectedTier as keyof typeof tierMapping] || 'Enterprise ($999)';
            
            const subscriptionData = {
              fields: {
                'Subscription Tier': `${data.companyName} - ${data.selectedTier} Plan`,
                'Tier Type': mappedTier,
                'Organization': [orgResult.id],
                'Status': 'Active',
                'Start Date': new Date().toISOString().split('T')[0],
                'Monthly Price': getTierPrice(data.selectedTier),
              }
            };

            subResult = await airtableRequest('Subscriptions', 'POST', subscriptionData);
            console.log('✅ Subscription created:', subResult.id);
          } catch (error) {
            console.error('❌ Subscription creation failed:', error);
          }

          // Create user account (simplified - only required fields)
          let userResult = null;
          try {
            const userAccountData = {
              fields: {
                'Email': data.email,
                'Organization': [orgResult.id],
              }
            };

            userResult = await airtableRequest('User Accounts', 'POST', userAccountData);
            console.log('✅ User Account created:', userResult.id);
          } catch (error) {
            console.error('❌ User Account creation failed:', error);
          }

          // Get the top 3 highest-scoring ESA programs if no specific selection was made
          let selectedPrograms: string[] = [];
          
          try {
            if (data.currentEnrollments && data.currentEnrollments.length > 0) {
              selectedPrograms = data.currentEnrollments.slice(0, 3);
            } else {
              // Get active ESA programs and select top 3 by operational score
              const programsData = await airtableRequest('ESA Program Tracker');
              const activeEsaPrograms = programsData.records
                .filter((record: AirtableRecord) => 
                  record.fields['Program Type'] && 
                  (record.fields['Program Type'].includes('ESA') || record.fields['Program Type'].includes('ESA-like')) &&
                  record.fields['Program Status'] === 'Active'
                )
                .slice(0, 3); // Take first 3 active programs
              selectedPrograms = activeEsaPrograms.map((p: AirtableRecord) => p.id);
            }
          } catch (error) {
            console.error('❌ Program selection failed:', error);
          }

          // Create Client Program Access records for selected ESA programs
          const programAccessRecords = [];
          
          try {

            console.log(`📋 Creating access for ${selectedPrograms.length} programs`);

            // Create program access records
            for (const programId of selectedPrograms) {
              const programAccessData = {
                fields: {
                  'Organization': [orgResult.id],
                  'ESA Program': [programId],
                  'Access Level': 'Full Access',
                  'Date Granted': new Date().toISOString().split('T')[0],
                  'Status': 'Active'
                }
              };
              
              try {
                const accessResult = await airtableRequest('Client Program Access', 'POST', programAccessData);
                programAccessRecords.push(accessResult.id);
                console.log(`✅ Program access created: ${accessResult.id}`);
              } catch (error) {
                console.error('❌ Program access creation failed:', error);
                // Continue with other programs even if one fails
              }
            }
          } catch (error) {
            console.error('❌ Program access setup failed:', error);
          }

          // Create inventory items mapped to ESA program requirements with AI enhancement
          const inventoryItems = [];
          
          try {
            // Extract and categorize products/services from vendor input
            const vendorServices = data.productServices || '';
            const serviceCategories = categorizeVendorServices(vendorServices);
            
            // Enhanced AI-powered inventory creation for paid tiers
            if (data.selectedTier !== 'free') {
              try {
                console.log('🤖 Running AI-enhanced inventory creation...');
                
                // Import AI services dynamically to avoid build issues
                const { ComplianceTranslator } = await import('../../services/complianceTranslator');
                const translator = new ComplianceTranslator();
                
                // Create inventory items for selected programs with AI translation
                for (const programId of selectedPrograms) {
                  const programRecord = await airtableRequest(`ESA Program Tracker/${programId}`);
                  const program = programRecord.fields;
                  
                  // Create sample products for AI translation
                  const sampleProducts = serviceCategories.map(category => ({
                    name: `${data.companyName} ${category.category}`,
                    description: `Professional ${category.category.toLowerCase()} services provided by ${data.companyName}`,
                    category: category.category,
                    price: 100,
                    ageRange: data.targetAgeGroups?.join(', ') || 'K-12',
                    subjects: data.primarySubjects?.join(', ') || 'All subjects'
                  }));
                  
                  if (sampleProducts.length > 0) {
                    const translations = await translator.translateProductsToESA(
                      sampleProducts,
                      program['Portal Technology'],
                      program['State']
                    );
                    
                    if (translations.success) {
                      for (const translation of translations.translations) {
                        const inventoryData = {
                          fields: {
                            'Organization': [orgResult.id],
                            'ESA Program': [programId],
                            'Item Name': translation.recommended.name,
                            'Category': translation.original.category,
                            'Unit Price': 100, // Default price
                            'Description': translation.recommended.description,
                            'Item URL': data.servicesUrl || '',
                            'Portal Technology': program['Portal Technology'],
                            'ESA Terminology': translation.recommended.esaCategory,
                            'Compliance Score': Math.round(translation.compliance.score * 100),
                            'Confidence Level': Math.round(translation.compliance.confidence * 100),
                            'Risk Level': translation.compliance.riskLevel,
                            'Status': translation.compliance.score >= 0.7 ? 'Ready for Portal' : 'Needs Review',
                            'Date Created': new Date().toISOString().split('T')[0],
                            'AI Enhanced': true
                          }
                        };
                        
                        try {
                          const itemResult = await airtableRequest('Inventory Items', 'POST', inventoryData);
                          inventoryItems.push(itemResult.id);
                          console.log(`✅ AI-enhanced inventory item created: ${itemResult.id}`);
                        } catch (error) {
                          console.error('Error creating AI-enhanced inventory item:', error);
                        }
                      }
                    } else {
                      console.log('⚠️ AI translation failed, falling back to basic inventory creation');
                      throw new Error('AI translation failed');
                    }
                  }
                }
              } catch (aiError) {
                console.error('❌ AI-enhanced inventory creation failed, falling back to basic method:', aiError);
                // Fall through to basic inventory creation
              }
            }
            
            // Fallback to basic inventory creation if AI fails or free tier
            if (inventoryItems.length === 0) {
              console.log('📝 Creating basic inventory items...');
              
              for (const programId of selectedPrograms) {
                const programRecord = await airtableRequest(`ESA Program Tracker/${programId}`);
                const program = programRecord.fields;
                
                const mappedItems = createInventoryItemsForProgram(
                  serviceCategories, 
                  program['State'], 
                  program['Portal Technology'],
                  program['Eligible Products']
                );
                
                for (const item of mappedItems) {
                  const inventoryData = {
                    fields: {
                      'Organization': [orgResult.id],
                      'ESA Program': [programId],
                      'Item Name': item.name,
                      'Category': item.category,
                      'Unit Price': item.unitPrice,
                      'Description': item.description,
                      'Item URL': item.url || data.servicesUrl || '',
                      'Portal Technology': program['Portal Technology'],
                      'ESA Terminology': item.esaTerminology,
                      'Status': 'Ready for Portal',
                      'Date Created': new Date().toISOString().split('T')[0],
                      'AI Enhanced': false
                    }
                  };
                  
                  try {
                    const itemResult = await airtableRequest('Inventory Items', 'POST', inventoryData);
                    inventoryItems.push(itemResult.id);
                  } catch (error) {
                    console.error('Error creating basic inventory item:', error);
                    // Note: Inventory Items table may not exist yet - this is optional for core onboarding
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Inventory items creation failed:', error);
          }

          return res.status(200).json({ 
            success: true, 
            organizationId: orgResult.id,
            subscriptionId: subResult?.id || null,
            userId: userResult?.id || null,
            programAccessIds: programAccessRecords,
            programsGranted: programAccessRecords.length,
            inventoryItemsCreated: inventoryItems.length,
            inventoryItemIds: inventoryItems,
            status: {
              organization: !!orgResult.id,
              subscription: !!subResult?.id,
              userAccount: !!userResult?.id,
              programAccess: programAccessRecords.length > 0,
              inventoryItems: inventoryItems.length > 0
            }
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Airtable API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getTierPrice(tier: string): number {
  switch (tier.toLowerCase()) {
    case 'free': return 0;
    case 'starter': return 99;
    case 'professional': return 299;
    case 'enterprise': return 999;
    default: return 0;
  }
}

// Categorize vendor services into ESA-compatible categories
function categorizeVendorServices(servicesDescription: string): Array<{category: string, keywords: string[], confidence: number}> {
  const categories = [
    {
      category: 'Tutoring Services',
      keywords: ['tutor', 'tutoring', 'instruction', 'teaching', 'academic support', '1-on-1', 'one-on-one'],
      confidence: 0
    },
    {
      category: 'Curriculum & Content',
      keywords: ['curriculum', 'textbook', 'course', 'content', 'material', 'workbook', 'lesson'],
      confidence: 0
    },
    {
      category: 'Educational Technology',
      keywords: ['software', 'app', 'platform', 'technology', 'digital', 'online', 'computer', 'tablet'],
      confidence: 0
    },
    {
      category: 'Assessment & Testing',
      keywords: ['test', 'assessment', 'evaluation', 'exam', 'SAT', 'ACT', 'AP', 'standardized'],
      confidence: 0
    },
    {
      category: 'Educational Therapies',
      keywords: ['therapy', 'OT', 'PT', 'speech', 'behavioral', 'special needs', 'intervention'],
      confidence: 0
    },
    {
      category: 'Enrichment Programs',
      keywords: ['camp', 'enrichment', 'extracurricular', 'art', 'music', 'STEM', 'science'],
      confidence: 0
    }
  ];

  const lowercaseDescription = servicesDescription.toLowerCase();
  
  categories.forEach(category => {
    category.confidence = category.keywords.reduce((count, keyword) => {
      return count + (lowercaseDescription.includes(keyword) ? 1 : 0);
    }, 0);
  });

  return categories.filter(cat => cat.confidence > 0).sort((a, b) => b.confidence - a.confidence);
}

// Create inventory items mapped to specific ESA program requirements
function createInventoryItemsForProgram(
  serviceCategories: Array<{category: string, keywords: string[], confidence: number}>,
  state: string,
  portalTechnology: string,
  eligibleProducts: string
): Array<{name: string, category: string, unitPrice: number, description: string, url?: string, esaTerminology: string}> {
  const items: Array<{name: string, category: string, unitPrice: number, description: string, url?: string, esaTerminology: string}> = [];

  // Default pricing based on category and state market analysis
  const pricingGuide = {
    'Tutoring Services': { 'Arizona': 45, 'Florida': 40, 'Utah': 50, 'default': 45 },
    'Curriculum & Content': { 'Arizona': 150, 'Florida': 120, 'Utah': 180, 'default': 150 },
    'Educational Technology': { 'Arizona': 25, 'Florida': 30, 'Utah': 35, 'default': 30 },
    'Assessment & Testing': { 'Arizona': 75, 'Florida': 65, 'Utah': 85, 'default': 75 },
    'Educational Therapies': { 'Arizona': 85, 'Florida': 95, 'Utah': 100, 'default': 90 },
    'Enrichment Programs': { 'Arizona': 60, 'Florida': 55, 'Utah': 70, 'default': 60 }
  };

  serviceCategories.forEach(service => {
    const basePrice = pricingGuide[service.category]?.[state] || pricingGuide[service.category]?.['default'] || 50;
    
    // Map to ESA-specific terminology based on portal technology and eligible products
    let esaTerminology = service.category;
    let itemName = service.category;
    let description = `Professional ${service.category.toLowerCase()} services`;

    // Portal-specific mappings
    if (portalTechnology === 'ClassWallet') {
      // Arizona ESA / ClassWallet terminology
      switch (service.category) {
        case 'Tutoring Services':
          esaTerminology = 'Instructional Services';
          itemName = 'Academic Tutoring Services';
          description = 'Qualified educational instruction and tutoring services per Arizona ESA guidelines';
          break;
        case 'Curriculum & Content':
          esaTerminology = 'Curriculum and Educational Materials';
          itemName = 'Educational Curriculum Package';
          description = 'State-approved curriculum and educational materials for homeschool or supplemental instruction';
          break;
        case 'Educational Technology':
          esaTerminology = 'Educational Software and Technology';
          itemName = 'Educational Technology License';
          description = 'Educational software subscriptions and digital learning platforms';
          break;
      }
    } else if (portalTechnology === 'Odyssey') {
      // Utah / Odyssey terminology
      switch (service.category) {
        case 'Tutoring Services':
          esaTerminology = 'Tutoring Services';
          itemName = 'Professional Tutoring Services';
          description = 'Individual or group tutoring services provided by qualified instructors';
          break;
        case 'Curriculum & Content':
          esaTerminology = 'Curriculum/Textbooks/Materials';
          itemName = 'Curriculum and Learning Materials';
          description = 'Educational curriculum, textbooks, and supplementary learning materials';
          break;
      }
    } else if (portalTechnology === 'Step Up For Students') {
      // Florida Step Up For Students / MyScholarShop terminology
      switch (service.category) {
        case 'Tutoring Services':
          esaTerminology = 'Educational Services';
          itemName = 'Educational Tutoring Services';
          description = 'Professional tutoring services provided by qualified educational professionals';
          break;
        case 'Educational Therapies':
          esaTerminology = 'Therapeutic Services';
          itemName = 'Therapeutic Educational Services';
          description = 'Specialized educational therapy services (OT, PT, SLP, behavioral interventions)';
          break;
        case 'Curriculum & Content':
          esaTerminology = 'Instructional Materials';
          itemName = 'Educational Curriculum and Materials';
          description = 'Educational curriculum, textbooks, and instructional materials';
          break;
        case 'Educational Technology':
          esaTerminology = 'Educational Software and Technology';
          itemName = 'Educational Technology Solutions';
          description = 'Educational software subscriptions and digital learning platforms';
          break;
      }
    } else if (portalTechnology === 'Other') {
      // Generic / Custom system terminology
      switch (service.category) {
        case 'Tutoring Services':
          esaTerminology = 'Tutoring Services';
          itemName = 'Educational Tutoring Services';
          description = 'Professional tutoring services provided by qualified educational professionals';
          break;
        case 'Educational Therapies':
          esaTerminology = 'Educational Therapies';
          itemName = 'Therapeutic Educational Services';
          description = 'Specialized educational therapy services (OT, PT, SLP, behavioral interventions)';
          break;
      }
    }

    items.push({
      name: itemName,
      category: service.category,
      unitPrice: basePrice,
      description: description,
      esaTerminology: esaTerminology
    });
  });

  return items;
}

