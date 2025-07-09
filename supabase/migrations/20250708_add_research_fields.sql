-- Add New Research Fields
-- Task: Add New Research Fields
-- Approved by: Control Tower User  
-- Added by: ESA_Market_Intelligence_Agent
-- Purpose: Enable enhanced research capabilities for vendor onboarding tracking and compliance requirements

-- Add the two new research fields to esa_program_tracker table
ALTER TABLE esa_program_tracker 
ADD COLUMN IF NOT EXISTS vendor_onboarding_time VARCHAR(255) DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS compliance_requirements TEXT DEFAULT 'Unknown';

-- Create indexes for the new fields for better query performance
CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_vendor_onboarding_time 
ON esa_program_tracker (vendor_onboarding_time);

CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_compliance_requirements 
ON esa_program_tracker USING gin (to_tsvector('english', compliance_requirements));

-- Update the updated_at timestamp to reflect schema changes
UPDATE esa_program_tracker SET updated_at = NOW() WHERE id IS NOT NULL;

-- Log successful completion
SELECT 'New Research Fields (vendor_onboarding_time, compliance_requirements) added successfully!' as message;