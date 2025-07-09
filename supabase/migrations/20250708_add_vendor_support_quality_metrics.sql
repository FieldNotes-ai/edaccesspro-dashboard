-- Add Vendor Support Quality Metrics
-- Task ID: 979b65a2-9c78-4ee7-8d08-3bc01ef02a94
-- Approved by: Control Tower User
-- Added by: ESA_Market_Intelligence_Agent
-- Purpose: Enable vendor experience optimization through support quality tracking

-- Add the three new fields to esa_program_tracker table
ALTER TABLE esa_program_tracker 
ADD COLUMN IF NOT EXISTS support_response_time VARCHAR(255) DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS vendor_satisfaction_score DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS technical_support_quality VARCHAR(255) DEFAULT 'Unknown';

-- Create indexes for the new fields for better query performance
CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_support_response_time 
ON esa_program_tracker (support_response_time);

CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_vendor_satisfaction_score 
ON esa_program_tracker (vendor_satisfaction_score);

CREATE INDEX IF NOT EXISTS idx_esa_program_tracker_technical_support_quality 
ON esa_program_tracker (technical_support_quality);

-- Update the updated_at timestamp to reflect schema changes
UPDATE esa_program_tracker SET updated_at = NOW() WHERE id IS NOT NULL;

-- Log successful completion
SELECT 'Vendor Support Quality Metrics fields added successfully!' as message;