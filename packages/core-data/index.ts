export type { DataClient } from './DataClient';
export { airtableClient, supabaseClient, USE_SUPABASE } from './DataClient';

// Default client export
import { airtableClient } from './DataClient';
export const dataClient = airtableClient;