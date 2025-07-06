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
    const errorBody = await response.text();
    console.error('Airtable API Error Details:', errorBody);
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
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

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'POST') {
      const { action, data } = req.body;

      switch (action) {
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
          
          // Create subscription record - map tiers to current Airtable format
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

          const subResult = await airtableRequest('Subscriptions', 'POST', subscriptionData);

          // Create user account (simplified - only required fields)
          const userAccountData = {
            fields: {
              'Email': data.email,
              'Organization': [orgResult.id],
            }
          };

          const userResult = await airtableRequest('User Accounts', 'POST', userAccountData);

          return res.status(200).json({ 
            success: true, 
            organizationId: orgResult.id,
            subscriptionId: subResult.id,
            userId: userResult.id
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