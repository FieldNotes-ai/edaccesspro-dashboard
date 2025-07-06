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
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { table, action } = req.query;

      switch (action) {
        case 'programs':
          // Get ESA programs for dashboard
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

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'POST') {
      const { action, data } = req.body;

      switch (action) {
        case 'create_vendor':
          // Create new vendor organization
          const newOrgData = {
            fields: {
              'Organization Name': data.companyName,
              'Primary Contact Name': data.contactName,
              'Primary Contact Email': data.email,
              'Status': 'Active',
              'Organization Type': data.organizationType || [],
              'Date Created': new Date().toISOString().split('T')[0],
              'Notes': `Created via EdAccessPro dashboard. Products: ${data.products?.join(', ') || 'TBD'}`,
            }
          };

          const orgResult = await airtableRequest('Organizations', 'POST', newOrgData);
          
          // Create subscription record
          const subscriptionData = {
            fields: {
              'Subscription Tier': `${data.companyName} - ${data.selectedTier} Plan`,
              'Tier Type': data.selectedTier,
              'Organization': [orgResult.id],
              'Status': 'Active',
              'Start Date': new Date().toISOString().split('T')[0],
              'Monthly Price': getTierPrice(data.selectedTier),
            }
          };

          const subResult = await airtableRequest('Subscriptions', 'POST', subscriptionData);

          // Create user account
          const userAccountData = {
            fields: {
              'Full Name': data.contactName,
              'Email': data.email,
              'Organization': [orgResult.id],
              'Role': 'Admin',
              'Status': 'Active',
              'Date Created': new Date().toISOString().split('T')[0],
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