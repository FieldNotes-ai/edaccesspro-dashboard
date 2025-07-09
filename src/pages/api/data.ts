import { NextApiRequest, NextApiResponse } from 'next';
import { dataClient } from '../../../packages/core-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'programs':
        const programsData = await dataClient.get('ESA Program Tracker');
        return res.status(200).json({ 
          programs: programsData.map((record: any) => ({
            id: record.id,
            name: record.fields?.['Program Name'] || record.fields?.name,
            state: record.fields?.State || record.fields?.state,
            annualAmount: record.fields?.['Annual Amount'] || record.fields?.annual_amount,
            marketSize: record.fields?.['Market Size'] || record.fields?.market_size,
            portalTechnology: record.fields?.['Portal Technology'] || record.fields?.portal_technology
          }))
        });

      case 'esa-programs-active':
        const activePrograms = await dataClient.get('ESA Program Tracker', {
          filterByFormula: "AND({Status} = 'Active', {Program Type} = 'ESA')"
        });
        return res.status(200).json({
          programs: activePrograms.map((record: any) => ({
            id: record.id,
            name: record.fields?.['Program Name'] || record.fields?.name,
            state: record.fields?.State || record.fields?.state,
            portalTechnology: record.fields?.['Portal Technology'] || record.fields?.portal_technology
          }))
        });

      case 'enhanced-programs':
        const enhancedData = await dataClient.get('ESA Program Tracker');
        return res.status(200).json({
          programs: enhancedData.map((record: any) => ({
            id: record.id,
            name: record.fields?.['Program Name'] || record.fields?.name,
            state: record.fields?.State || record.fields?.state,
            annualAmount: record.fields?.['Annual Amount'] || record.fields?.annual_amount,
            marketSize: record.fields?.['Market Size'] || record.fields?.market_size,
            portalTechnology: record.fields?.['Portal Technology'] || record.fields?.portal_technology,
            status: record.fields?.Status || record.fields?.status
          }))
        });

      case 'organizations':
        const orgsData = await dataClient.get('Organizations');
        return res.status(200).json({ organizations: orgsData });

      case 'subscriptions':
        const subsData = await dataClient.get('Subscriptions');
        return res.status(200).json({ subscriptions: subsData });

      default:
        if (req.method === 'POST') {
          // Handle vendor onboarding submission
          const { organizationName, organizationType, targetPrograms, contactInfo } = req.body;

          // Create organization record
          const orgResult = await dataClient.insert('Organizations', {
            'Organization Name': organizationName,
            'Organization Type': organizationType,
            'Contact Email': contactInfo.email,
            'Contact Name': contactInfo.name,
            'Status': 'Pending Review'
          });

          // Create subscription record if target programs specified
          if (targetPrograms && targetPrograms.length > 0) {
            await dataClient.insert('Subscriptions', {
              'Organization': [orgResult.id],
              'Target Programs': targetPrograms,
              'Subscription Status': 'Pending',
              'Created Date': new Date().toISOString()
            });
          }

          return res.status(200).json({ 
            success: true, 
            organizationId: orgResult.id 
          });
        }

        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Data API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}