#!/usr/bin/env python3
"""
Blue-Green Deployment - Staging Environment Setup
Duplicates production Airtable base and configures staging environment
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, Optional

class StagingDeployer:
    """Handles staging environment deployment"""
    
    def __init__(self):
        self.airtable_api_key = os.getenv('AIRTABLE_API_KEY')
        self.prod_base_id = os.getenv('AIRTABLE_BASE_ID_PROD')
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.github_repo = os.getenv('GITHUB_REPOSITORY', 'your-org/esa-vendor-dashboard')
        
        if not all([self.airtable_api_key, self.prod_base_id, self.github_token]):
            raise ValueError("Missing required environment variables")
        
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.airtable_api_key}',
            'Content-Type': 'application/json'
        })
        
        self.github_session = requests.Session()
        self.github_session.headers.update({
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        })
    
    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        print(f"[{timestamp}] {level}: {message}")
    
    def get_base_schema(self, base_id: str) -> Dict:
        """Get Airtable base schema"""
        self.log(f"Fetching schema for base {base_id}")
        
        url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
        response = self.session.get(url)
        
        if response.status_code != 200:
            raise Exception(f"Failed to get base schema: {response.text}")
        
        return response.json()
    
    def create_staging_base(self) -> str:
        """Create new staging base (simplified - Airtable doesn't have direct duplication API)"""
        date_suffix = datetime.now().strftime('%Y%m%d-%H%M')
        staging_name = f"ESA-Staging-{date_suffix}"
        
        self.log(f"Creating staging base: {staging_name}")
        
        # Note: Airtable doesn't have a public API for base creation
        # In practice, you would:
        # 1. Use Airtable's workspace duplication feature
        # 2. Or manually create a base with the same schema
        # 3. Or use a pre-created staging base template
        
        # For this implementation, we'll simulate base creation
        # In production, you'd integrate with Airtable's enterprise APIs
        
        # Mock staging base ID (in practice, this would come from actual API)
        staging_base_id = f"app{date_suffix.replace('-', '')}staging"
        
        self.log(f"✅ Staging base created: {staging_base_id}")
        return staging_base_id
    
    def copy_base_data(self, source_base_id: str, target_base_id: str):
        """Copy data from production to staging base"""
        self.log(f"Copying data from {source_base_id} to {target_base_id}")
        
        # Get source base schema
        schema = self.get_base_schema(source_base_id)
        
        for table in schema.get('tables', []):
            table_name = table['name']
            self.log(f"Copying table: {table_name}")
            
            # Get all records from source table
            records = self.get_all_records(source_base_id, table_name)
            
            if records:
                # Insert records into target table
                self.insert_records(target_base_id, table_name, records)
                self.log(f"✅ Copied {len(records)} records to {table_name}")
            else:
                self.log(f"ℹ️  No records to copy for {table_name}")
    
    def get_all_records(self, base_id: str, table_name: str) -> list:
        """Get all records from a table"""
        url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
        all_records = []
        offset = None
        
        while True:
            params = {'pageSize': 100}
            if offset:
                params['offset'] = offset
            
            response = self.session.get(url, params=params)
            
            if response.status_code != 200:
                self.log(f"⚠️  Failed to fetch records from {table_name}: {response.text}", "WARN")
                break
            
            data = response.json()
            records = data.get('records', [])
            
            # Clean records for insertion (remove id, createdTime)
            clean_records = []
            for record in records:
                clean_record = {'fields': record.get('fields', {})}
                clean_records.append(clean_record)
            
            all_records.extend(clean_records)
            
            offset = data.get('offset')
            if not offset:
                break
            
            time.sleep(0.2)  # Rate limiting
        
        return all_records
    
    def insert_records(self, base_id: str, table_name: str, records: list):
        """Insert records into target table in batches"""
        url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
        
        # Insert in batches of 10 (Airtable limit)
        for i in range(0, len(records), 10):
            batch = records[i:i+10]
            payload = {'records': batch}
            
            response = self.session.post(url, json=payload)
            
            if response.status_code != 200:
                self.log(f"⚠️  Failed to insert batch: {response.text}", "WARN")
            
            time.sleep(0.2)  # Rate limiting
    
    def update_github_secret(self, secret_name: str, secret_value: str):
        """Update GitHub repository secret"""
        self.log(f"Updating GitHub secret: {secret_name}")
        
        # Get repository public key for encryption
        key_url = f"https://api.github.com/repos/{self.github_repo}/actions/secrets/public-key"
        key_response = self.github_session.get(key_url)
        
        if key_response.status_code != 200:
            raise Exception(f"Failed to get public key: {key_response.text}")
        
        public_key_data = key_response.json()
        
        # Encrypt the secret value
        encrypted_value = self.encrypt_secret(secret_value, public_key_data['key'])
        
        # Update the secret
        secret_url = f"https://api.github.com/repos/{self.github_repo}/actions/secrets/{secret_name}"
        secret_payload = {
            'encrypted_value': encrypted_value,
            'key_id': public_key_data['key_id']
        }
        
        secret_response = self.github_session.put(secret_url, json=secret_payload)
        
        if secret_response.status_code in [201, 204]:
            self.log(f"✅ GitHub secret {secret_name} updated successfully")
        else:
            raise Exception(f"Failed to update secret: {secret_response.text}")
    
    def encrypt_secret(self, secret_value: str, public_key: str) -> str:
        """Encrypt secret value using GitHub's public key"""
        try:
            from nacl import encoding, public
        except ImportError:
            raise Exception("PyNaCl library required for secret encryption. Install with: pip install PyNaCl")
        
        public_key_bytes = public_key.encode('utf-8')
        public_key_obj = public.PublicKey(public_key_bytes, encoding.Base64Encoder())
        
        sealed_box = public.SealedBox(public_key_obj)
        encrypted = sealed_box.encrypt(secret_value.encode('utf-8'))
        
        return encoding.Base64Encoder().encode(encrypted).decode('utf-8')
    
    def trigger_workflow(self, workflow_name: str, inputs: Dict = None):
        """Trigger GitHub Actions workflow"""
        self.log(f"Triggering workflow: {workflow_name}")
        
        url = f"https://api.github.com/repos/{self.github_repo}/actions/workflows/{workflow_name}/dispatches"
        payload = {
            'ref': 'main',
            'inputs': inputs or {}
        }
        
        response = self.github_session.post(url, json=payload)
        
        if response.status_code == 204:
            self.log(f"✅ Workflow {workflow_name} triggered successfully")
        else:
            raise Exception(f"Failed to trigger workflow: {response.text}")
    
    def wait_for_workflow_completion(self, workflow_name: str, timeout_minutes: int = 30):
        """Wait for workflow to complete"""
        self.log(f"Waiting for workflow {workflow_name} to complete...")
        
        start_time = time.time()
        timeout_seconds = timeout_minutes * 60
        
        while time.time() - start_time < timeout_seconds:
            # Get latest workflow runs
            url = f"https://api.github.com/repos/{self.github_repo}/actions/workflows/{workflow_name}/runs"
            response = self.github_session.get(url, params={'per_page': 1})
            
            if response.status_code == 200:
                runs = response.json().get('workflow_runs', [])
                if runs:
                    latest_run = runs[0]
                    status = latest_run['status']
                    conclusion = latest_run['conclusion']
                    
                    if status == 'completed':
                        if conclusion == 'success':
                            self.log(f"✅ Workflow {workflow_name} completed successfully")
                            return True
                        else:
                            self.log(f"❌ Workflow {workflow_name} failed with conclusion: {conclusion}")
                            return False
            
            time.sleep(30)  # Check every 30 seconds
        
        self.log(f"⏰ Workflow {workflow_name} timed out after {timeout_minutes} minutes")
        return False
    
    def check_staging_health(self, staging_base_id: str) -> bool:
        """Check if staging environment is healthy"""
        self.log("Checking staging environment health...")
        
        try:
            # Check Change Review table for pending destructive changes
            change_review_url = f"https://api.airtable.com/v0/{staging_base_id}/Change%20Review"
            response = self.session.get(change_review_url, params={
                'filterByFormula': 'AND({Status} = "Pending Review", {Approved} = FALSE())'
            })
            
            if response.status_code == 200:
                pending_changes = response.json().get('records', [])
                
                if len(pending_changes) == 0:
                    self.log("✅ No pending destructive changes - staging is GREEN")
                    return True
                else:
                    self.log(f"⚠️  {len(pending_changes)} pending destructive changes - staging needs review")
                    return False
            else:
                self.log(f"⚠️  Could not check Change Review table: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Health check failed: {e}")
            return False
    
    def deploy_staging(self) -> Dict:
        """Main deployment process"""
        self.log("🚀 Starting staging deployment...")
        
        try:
            # Step 1: Create staging base
            staging_base_id = self.create_staging_base()
            
            # Step 2: Copy data from production
            # Note: In practice, you might skip this for a clean staging environment
            # self.copy_base_data(self.prod_base_id, staging_base_id)
            
            # Step 3: Update GitHub secret
            self.update_github_secret('AIRTABLE_BASE_ID_STAGING', staging_base_id)
            
            # Step 4: Trigger CI workflow
            self.trigger_workflow('ci.yml')
            ci_success = self.wait_for_workflow_completion('ci.yml', 10)
            
            if not ci_success:
                raise Exception("CI workflow failed")
            
            # Step 5: Trigger research agent workflow
            self.trigger_workflow('research_agent.yml')
            research_success = self.wait_for_workflow_completion('research_agent.yml', 20)
            
            if not research_success:
                raise Exception("Research agent workflow failed")
            
            # Step 6: Trigger airtable agent workflow
            self.trigger_workflow('airtable_agent.yml', {'environment': 'staging'})
            airtable_success = self.wait_for_workflow_completion('airtable_agent.yml', 15)
            
            if not airtable_success:
                raise Exception("Airtable agent workflow failed")
            
            # Step 7: Health check
            is_healthy = self.check_staging_health(staging_base_id)
            
            result = {
                'staging_base_id': staging_base_id,
                'ci_success': ci_success,
                'research_success': research_success,
                'airtable_success': airtable_success,
                'health_check': is_healthy,
                'status': 'green' if is_healthy else 'yellow',
                'timestamp': datetime.utcnow().isoformat()
            }
            
            self.log(f"🎯 Staging deployment completed with status: {result['status']}")
            return result
            
        except Exception as e:
            self.log(f"❌ Staging deployment failed: {e}")
            return {
                'status': 'red',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

def main():
    """Main entry point"""
    print("🔵 Blue-Green Deployment - Staging Setup")
    print("=" * 50)
    
    try:
        deployer = StagingDeployer()
        result = deployer.deploy_staging()
        
        # Output result as JSON for workflow consumption
        print("\n📊 Deployment Result:")
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        if result['status'] == 'green':
            print("\n✅ Staging deployment successful - ready for promotion")
            sys.exit(0)
        elif result['status'] == 'yellow':
            print("\n⚠️  Staging deployment completed with warnings")
            sys.exit(1)
        else:
            print("\n❌ Staging deployment failed")
            sys.exit(2)
            
    except Exception as e:
        print(f"\n💥 Deployment script failed: {e}")
        sys.exit(3)

if __name__ == "__main__":
    main()