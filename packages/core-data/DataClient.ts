// Core data access interface - database agnostic
export interface DataClient {
  get(table: string, opts?: any): Promise<any>;
  insert(table: string, row: any): Promise<any>;
  update(table: string, id: string, patch: any): Promise<any>;
}

// Feature flag for database selection
export const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

// Airtable implementation
import Airtable from 'airtable';

const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_KEY 
}).base(process.env.AIRTABLE_BASE!);

export const airtableClient: DataClient = {
  get: (tbl, { filterByFormula = '' } = {}) =>
    base(tbl).select({ filterByFormula }).all(),
  insert: (tbl, row) => base(tbl).create(row),
  update: (tbl, id, patch) => base(tbl).update(id, patch)
};

// Supabase implementation (for future migration)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const supabaseClient: DataClient = {
  get: async (tbl, opts = {}) => {
    const { data, error } = await supabase.from(tbl).select('*');
    if (error) throw error;
    return data;
  },
  insert: async (tbl, row) => {
    const { data, error } = await supabase.from(tbl).insert(row).select();
    if (error) throw error;
    return data[0];
  },
  update: async (tbl, id, patch) => {
    const { data, error } = await supabase.from(tbl).update(patch).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
};

// Primary client - switches based on feature flag
export const dataClient: DataClient = USE_SUPABASE ? supabaseClient : airtableClient;