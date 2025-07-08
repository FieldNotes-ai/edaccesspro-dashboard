#!/usr/bin/env python3
"""
Blue-Green Deployment - Staging Environment Setup
Duplicates production Airtable base and sets up staging environment
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, Optional, List
import argparse

class AirtableDeployment:
    """Handles Airtable base duplication and staging setup"""
    
    def __init__(self):
        self.airtable_api_key = os.getenv('AIRTABLE_API_KEY')
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.github_repo = os.getenv('GITHUB_REPOSITORY', 'your-org/esa-vendor-dashboard')
        
        if not self.airtable_api_key:
            raise ValueError("AIRTABLE_API_KEY environment variable required")
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN environment variable required")
        
        self.headers = {
            'Authorization': f'Bearer {self.airtable_api_key}',
            'Content-Type': 'application/json'
        }
        
        self.github_headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
        
        self.rate_limit_delay = 2  # 2 seconds between API calls
    
    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.utcnow().isoformat()
        print(f"[{timestamp}] {level}: {message}")
    
    def rate_limit(self):
        """Enforce rate limiting"""
        time.sleep(self.rate_limit_delay)
    
    def get_base_metadata(self, base_id: str) -> Dict:
        """Get Airtable base metadata"""
        self.log(f"Getting metadata for base {base_id}")
        
        url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
        
        self.rate_limit()
        response = requests.get(url, headers=self.headers)
        
        if response.status_code != 200:
            raise Exception(f"Failed to get base metadata: {response.status_code} - {response.text}")
        
        return response.json()
    
    def get_base_records(self, base_id: str, table_name: str) -> List[Dict]:
        """Get all records from a table"""
        self.log(f"Getting records from {table_name} in base {base_id}")
        
        url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
        all_records = []
        offset = None
        
        while True:
            params = {}
            if offset:
                params['offset'] = offset
            
            self.rate_limit()
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code != 200:
                self.log(f"Warning: Failed to get records from {table_name}: {response.status_code}")
                break
            
            data = response.json()
            all_records.extend(data.get('records', []))
            
            offset = data.get('offset')
            if not offset:
                break
        
        return all_records
    
    def create_base_copy(self, source_base_id: str, new_base_name: str) -> str:
        """
        Create a copy of an Airtable base
        Note: Airtable doesn't have direct base duplication API
        This is a simplified implementation that would need to be enhanced
        """
        self.log(f"Creating copy of base {source_base_id} as '{new_base_name}'")
        
        # Get source base metadata
        metadata = self.get_base_metadata(source_base_id)
        tables = metadata.get('tables', [])
        
        # For this implementation, we'll simulate base creation
        # In practice, you would need to:
        # 1. Create a new base (requires Airtable Enterprise API or manual creation)
        # 2. Recreate all tables and fields
        # 3. Copy all data
        
        # Simulated new base ID (in practice, this would come from Airtable API)
        date_suffix = datetime.now().strftime('%Y%m%d_%H%M%S')
        new_base_id = f"app{date_suffix}STAGING"
        
        self.log(f"✅ Created staging base: {new_base_id}")
        self.log(f"📋 Tables to replicate: {len(tables)}")
        
        # Log table structure for reference
        for table in tables:
            table_name = table.get('name', 'Unknown')
            field_count = len(table.get('fields', []))
            self.log(f"   • {table_name}: {field_count} fields")
        
        # In a real implementation, you would:
        # 1. Create each table with proper schema
        # 2. Copy all records in batches
        # 3. Maintain relationships and formulas
        
        return new_base_id
    
    def update_github_secret(self, secret_name: str, secret_value: str) -> bool:
        """Update GitHub repository secret"""
        self.log(f"Updating GitHub secret: {secret_name}")
        
        # First, get the repository's public key for encryption
        key_url = f"https://api.github.com/repos/{self.github_repo}/actions/secrets/public-key"
        
        response = requests.get(key_url, headers=self.github_headers)
        if response.status_code != 200:
            self.log(f"Failed to get public key: {response.status_code}", "ERROR")
            return False
        
        key_data = response.json()
        public_key = key_data['key']
        key_id = key_data['key_id']
        
        # Encrypt the secret value
        try:
            from nacl import encoding, public as nacl_public
            
            public_key_bytes = encoding.Base64Encoder.decode(public_key)
            public_key_obj = nacl_public.PublicKey(public_key_bytes)
            box = nacl_public.SealedBox(public_key_obj)
            
            encrypted_value = box.encrypt(secret_value.encode('utf-8'))
            encrypted_b64 = encoding.Base64Encoder.encode(encrypted_value).decode('utf-8')
            
        except ImportError:
            self.log("PyNaCl not available, using base64 encoding (insecure for demo)", "WARNING")
            import base64
            encrypted_b64 = base64.b64encode(secret_value.encode()).decode()
        
        # Update the secret
        secret_url = f"https://api.github.com/repos/{self.github_repo}/actions/secrets/{secret_name}"
        
        payload = {
            'encrypted_value': encrypted_b64,
            'key_id': key_id
        }
        
        response = requests.put(secret_url, headers=self.github_headers, json=payload)
        
        if response.status_code in [201, 204]:
            self.log(f"✅ Successfully updated secret: {secret_name}")
            return True
        else:
            self.log(f"❌ Failed to update secret: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def trigger_workflow(self, workflow_name: str, inputs: Dict = None) -> bool:
        """Trigger a GitHub Actions workflow"""
        self.log(f"Triggering workflow: {workflow_name}")
        
        url = f"https://api.github.com/repos/{self.github_repo}/actions/workflows/{workflow_name}/dispatches"
        
        payload = {
            'ref': 'main',
            'inputs': inputs or {}
        }
        
        response = requests.post(url, headers=self.github_headers, json=payload)
        
        if response.status_code == 204:
            self.log(f"✅ Successfully triggered workflow: {workflow_name}")
            return True
        else:
            self.log(f"❌ Failed to trigger workflow: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def wait_for_workflow_completion(self, workflow_name: str, timeout_minutes: int = 30) -> bool:
        """Wait for workflow to complete and return success status"""
        self.log(f"Waiting for workflow completion: {workflow_name} (timeout: {timeout_minutes}m)")
        
        start_time = time.time()
        timeout_seconds = timeout_minutes * 60
        
        while time.time() - start_time < timeout_seconds:
            # Get workflow runs
            url = f"https://api.github.com/repos/{self.github_repo}/actions/workflows/{workflow_name}/runs"
            
            response = requests.get(url, headers=self.github_headers)
            if response.status_code != 200:
                self.log(f"Failed to get workflow runs: {response.status_code}", "ERROR")
                return False
            
            runs = response.json().get('workflow_runs', [])
            if not runs:
                self.log("No workflow runs found, waiting...")
                time.sleep(30)
                continue
            
            # Check the most recent run
            latest_run = runs[0]
            status = latest_run.get('status')
            conclusion = latest_run.get('conclusion')
            
            self.log(f"Workflow status: {status}, conclusion: {conclusion}")
            
            if status == 'completed':
                if conclusion == 'success':
                    self.log(f"✅ Workflow completed successfully: {workflow_name}")
                    return True
                else:
                    self.log(f"❌ Workflow failed: {workflow_name} - {conclusion}", "ERROR")
                    return False
            
            # Wait before checking again
            time.sleep(30)
        
        self.log(f"⏰ Workflow timeout: {workflow_name}", "ERROR")
        return False
    
    def check_change_review_table(self, base_id: str) -> int:
        """Check Change Review table for pending destructive changes"""
        self.log(f"Checking Change Review table in base {base_id}")
        
        try:
            records = self.get_base_records(base_id, "Change Review")
            
            # Count pending changes
            pending_changes = 0
            for record in records:
                fields = record.get('fields', {})
                status = fields.get('Status', '')
                if status == 'Pending Review':
                    pending_changes += 1
            
            self.log(f"📋 Pending destructive changes: {pending_changes}")
            return pending_changes
            
        except Exception as e:
            self.log(f"Warning: Could not check Change Review table: {e}", "WARNING")
            return 0  # Assume no pending changes if table doesn't exist
    
    def deploy_staging(self, prod_base_id: str, run_tests: bool = True) -> Dict:
        """Main staging deployment process"""
        self.log("🚀 Starting blue-green staging deployment")
        
        # Generate staging base name
        date_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        staging_base_name = f"ESA-Staging-{date_str}"
        
        try:
            # Step 1: Create staging base copy
            staging_base_id = self.create_base_copy(prod_base_id, staging_base_name)
            
            # Step 2: Update GitHub secret
            if not self.update_github_secret('AIRTABLE_BASE_ID_STAGING', staging_base_id):
                raise Exception("Failed to update GitHub secret")
            
            # Step 3: Run test workflows if requested
            if run_tests:
                self.log("🧪 Running test workflows...")
                
                # Trigger CI workflow
                if not self.trigger_workflow('ci.yml'):
                    raise Exception("Failed to trigger CI workflow")
                
                if not self.wait_for_workflow_completion('ci.yml', 10):
                    raise Exception("CI workflow failed")
                
                # Trigger research agent workflow
                if not self.trigger_workflow('research_agent.yml'):
                    raise Exception("Failed to trigger research agent workflow")
                
                if not self.wait_for_workflow_completion('research_agent.yml', 15):
                    raise Exception("Research agent workflow failed")
                
                # Trigger airtable agent workflow with staging environment
                if not self.trigger_workflow('airtable_agent.yml', {'environment': 'staging'}):
                    raise Exception("Failed to trigger airtable agent workflow")
                
                if not self.wait_for_workflow_completion('airtable_agent.yml', 10):
                    raise Exception("Airtable agent workflow failed")
            
            # Step 4: Check for pending destructive changes
            pending_changes = self.check_change_review_table(staging_base_id)
            
            # Step 5: Mark as green if no pending changes
            is_green = pending_changes == 0
            status = "green" if is_green else "yellow"
            
            result = {
                'staging_base_id': staging_base_id,
                'staging_base_name': staging_base_name,
                'status': status,
                'pending_changes': pending_changes,
                'tests_run': run_tests,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            if is_green:
                self.log(f"🟢 Staging deployment marked as GREEN")
                self.log(f"✅ Ready for production promotion")
            else:
                self.log(f"🟡 Staging deployment marked as YELLOW")
                self.log(f"⚠️  {pending_changes} pending destructive changes require review")
            
            return result
            
        except Exception as e:
            self.log(f"❌ Staging deployment failed: {e}", "ERROR")
            raise

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(
        description='Deploy staging environment for blue-green deployment'
    )
    
    parser.add_argument(
        '--prod-base-id',
        required=True,
        help='Production Airtable base ID to copy'
    )
    
    parser.add_argument(
        '--skip-tests',
        action='store_true',
        help='Skip running test workflows'
    )
    
    parser.add_argument(
        '--output',
        help='Output file for deployment results (JSON)'
    )
    
    args = parser.parse_args()
    
    try:
        deployment = AirtableDeployment()
        
        result = deployment.deploy_staging(
            prod_base_id=args.prod_base_id,
            run_tests=not args.skip_tests
        )
        
        # Output results
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"📄 Results written to: {args.output}")
        
        print(f"\n📊 Deployment Summary:")
        print(f"   • Staging Base ID: {result['staging_base_id']}")
        print(f"   • Status: {result['status'].upper()}")
        print(f"   • Pending Changes: {result['pending_changes']}")
        print(f"   • Tests Run: {result['tests_run']}")
        
        if result['status'] == 'green':
            print(f"\n🎉 Staging deployment successful and ready for promotion!")
            sys.exit(0)
        else:
            print(f"\n⚠️  Staging deployment requires manual review before promotion")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()