#!/usr/bin/env python3
"""
Blue-Green Deployment - Production Promotion
Promotes green staging environment to production
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, Optional

class ProductionPromoter:
    """Handles promotion of staging to production"""
    
    def __init__(self):
        self.airtable_api_key = os.getenv('AIRTABLE_API_KEY')
        self.current_prod_base_id = os.getenv('AIRTABLE_BASE_ID_PROD')
        self.staging_base_id = os.getenv('AIRTABLE_BASE_ID_STAGING')
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.github_repo = os.getenv('GITHUB_REPOSITORY', 'your-org/esa-vendor-dashboard')
        
        if not all([self.airtable_api_key, self.current_prod_base_id, self.staging_base_id, self.github_token]):
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
    
    def verify_staging_health(self) -> bool:
        """Verify staging environment is healthy before promotion"""
        self.log("🔍 Verifying staging environment health...")
        
        try:
            # Check Change Review table for pending destructive changes
            change_review_url = f"https://api.airtable.com/v0/{self.staging_base_id}/Change%20Review"
            response = self.session.get(change_review_url, params={
                'filterByFormula': 'AND({Status} = "Pending Review", {Approved} = FALSE())'
            })
            
            if response.status_code == 200:
                pending_changes = response.json().get('records', [])
                
                if len(pending_changes) == 0:
                    self.log("✅ Staging health verified - no pending destructive changes")
                    return True
                else:
                    self.log(f"❌ Staging has {len(pending_changes)} pending destructive changes")
                    return False
            else:
                self.log(f"⚠️  Could not verify staging health: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Health verification failed: {e}")
            return False
    
    def get_base_info(self, base_id: str) -> Dict:
        """Get basic information about an Airtable base"""
        try:
            url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'base_id': base_id,
                    'table_count': len(data.get('tables', [])),
                    'accessible': True
                }
            else:
                return {
                    'base_id': base_id,
                    'accessible': False,
                    'error': response.text
                }
        except Exception as e:
            return {
                'base_id': base_id,
                'accessible': False,
                'error': str(e)
            }
    
    def rename_base(self, base_id: str, new_name: str) -> bool:
        """Rename an Airtable base (Note: This requires enterprise API access)"""
        self.log(f"📝 Renaming base {base_id} to {new_name}")
        
        # Note: Airtable doesn't have a public API for renaming bases
        # In practice, you would:
        # 1. Use Airtable's enterprise APIs
        # 2. Or manually rename through the web interface
        # 3. Or use workspace management tools
        
        # For this implementation, we'll log the action
        self.log(f"ℹ️  Base rename logged: {base_id} → {new_name}")
        self.log("⚠️  Manual base rename required in Airtable interface")
        
        return True
    
    def update_github_secret(self, secret_name: str, secret_value: str):
        """Update GitHub repository secret"""
        self.log(f"🔐 Updating GitHub secret: {secret_name}")
        
        try:
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
                return True
            else:
                raise Exception(f"Failed to update secret: {secret_response.text}")
                
        except Exception as e:
            self.log(f"❌ Failed to update GitHub secret: {e}")
            return False
    
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
    
    def create_backup_record(self, old_prod_base_id: str, new_prod_base_id: str) -> Dict:
        """Create a record of the promotion for rollback purposes"""
        backup_info = {
            'promotion_timestamp': datetime.utcnow().isoformat(),
            'old_production_base': old_prod_base_id,
            'new_production_base': new_prod_base_id,
            'backup_base_name': f"ESA-Backup-{datetime.now().strftime('%Y%m%d-%H%M')}",
            'rollback_command': f"python promote_to_prod.py --rollback {old_prod_base_id}"
        }
        
        # Save backup info to file
        with open('deployment_backup.json', 'w') as f:
            json.dump(backup_info, f, indent=2)
        
        self.log(f"💾 Backup record created: deployment_backup.json")
        return backup_info
    
    def validate_promotion_readiness(self) -> Dict:
        """Validate that promotion can proceed safely"""
        self.log("🔍 Validating promotion readiness...")
        
        validation_results = {
            'staging_health': False,
            'staging_accessible': False,
            'production_accessible': False,
            'github_api_access': False,
            'ready_for_promotion': False
        }
        
        # Check staging health
        validation_results['staging_health'] = self.verify_staging_health()
        
        # Check staging accessibility
        staging_info = self.get_base_info(self.staging_base_id)
        validation_results['staging_accessible'] = staging_info['accessible']
        
        # Check production accessibility
        prod_info = self.get_base_info(self.current_prod_base_id)
        validation_results['production_accessible'] = prod_info['accessible']
        
        # Check GitHub API access
        try:
            test_url = f"https://api.github.com/repos/{self.github_repo}"
            test_response = self.github_session.get(test_url)
            validation_results['github_api_access'] = test_response.status_code == 200
        except:
            validation_results['github_api_access'] = False
        
        # Overall readiness
        validation_results['ready_for_promotion'] = all([
            validation_results['staging_health'],
            validation_results['staging_accessible'],
            validation_results['production_accessible'],
            validation_results['github_api_access']
        ])
        
        return validation_results
    
    def promote_to_production(self) -> Dict:
        """Main promotion process"""
        self.log("🟢 Starting production promotion...")
        
        try:
            # Step 1: Validate readiness
            validation = self.validate_promotion_readiness()
            
            if not validation['ready_for_promotion']:
                raise Exception(f"Promotion validation failed: {validation}")
            
            self.log("✅ Promotion validation passed")
            
            # Step 2: Create backup record
            backup_info = self.create_backup_record(self.current_prod_base_id, self.staging_base_id)
            
            # Step 3: Rename old production base to backup
            backup_name = backup_info['backup_base_name']
            backup_success = self.rename_base(self.current_prod_base_id, backup_name)
            
            # Step 4: Promote staging to production
            promotion_success = self.update_github_secret('AIRTABLE_BASE_ID_PROD', self.staging_base_id)
            
            if not promotion_success:
                raise Exception("Failed to update production base ID secret")
            
            # Step 5: Update backup base secret for rollback capability
            backup_secret_success = self.update_github_secret('AIRTABLE_BASE_ID_BACKUP', self.current_prod_base_id)
            
            # Step 6: Verify promotion
            time.sleep(5)  # Allow GitHub secrets to propagate
            
            # Get updated production info
            new_prod_info = self.get_base_info(self.staging_base_id)
            
            result = {
                'status': 'success',
                'old_production_base': self.current_prod_base_id,
                'new_production_base': self.staging_base_id,
                'backup_name': backup_name,
                'backup_success': backup_success,
                'promotion_success': promotion_success,
                'backup_secret_success': backup_secret_success,
                'new_prod_accessible': new_prod_info['accessible'],
                'promotion_timestamp': datetime.utcnow().isoformat(),
                'validation_results': validation
            }
            
            self.log("🎉 Production promotion completed successfully!")
            self.log(f"📊 New production base: {self.staging_base_id}")
            self.log(f"💾 Backup base: {self.current_prod_base_id} ({backup_name})")
            
            return result
            
        except Exception as e:
            self.log(f"❌ Production promotion failed: {e}")
            return {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def rollback_promotion(self, backup_base_id: str) -> Dict:
        """Rollback to previous production version"""
        self.log(f"🔄 Rolling back to backup base: {backup_base_id}")
        
        try:
            # Verify backup base is accessible
            backup_info = self.get_base_info(backup_base_id)
            
            if not backup_info['accessible']:
                raise Exception(f"Backup base {backup_base_id} is not accessible")
            
            # Restore production secret
            rollback_success = self.update_github_secret('AIRTABLE_BASE_ID_PROD', backup_base_id)
            
            if not rollback_success:
                raise Exception("Failed to update production base ID during rollback")
            
            result = {
                'status': 'rollback_success',
                'restored_base': backup_base_id,
                'rollback_timestamp': datetime.utcnow().isoformat()
            }
            
            self.log("✅ Rollback completed successfully")
            return result
            
        except Exception as e:
            self.log(f"❌ Rollback failed: {e}")
            return {
                'status': 'rollback_failed',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

def main():
    """Main entry point"""
    print("🟢 Blue-Green Deployment - Production Promotion")
    print("=" * 50)
    
    # Check for rollback mode
    if len(sys.argv) > 1 and sys.argv[1] == '--rollback':
        if len(sys.argv) < 3:
            print("❌ Rollback requires backup base ID")
            print("Usage: python promote_to_prod.py --rollback <backup_base_id>")
            sys.exit(1)
        
        backup_base_id = sys.argv[2]
        print(f"🔄 Rollback mode: restoring {backup_base_id}")
        
        try:
            promoter = ProductionPromoter()
            result = promoter.rollback_promotion(backup_base_id)
            
            print("\n📊 Rollback Result:")
            print(json.dumps(result, indent=2))
            
            if result['status'] == 'rollback_success':
                print("\n✅ Rollback successful")
                sys.exit(0)
            else:
                print("\n❌ Rollback failed")
                sys.exit(1)
                
        except Exception as e:
            print(f"\n💥 Rollback script failed: {e}")
            sys.exit(3)
    
    # Normal promotion mode
    try:
        promoter = ProductionPromoter()
        result = promoter.promote_to_production()
        
        # Output result as JSON for workflow consumption
        print("\n📊 Promotion Result:")
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        if result['status'] == 'success':
            print("\n🎉 Production promotion successful!")
            print(f"🔗 New production base: {result['new_production_base']}")
            print(f"💾 Backup available: {result['old_production_base']}")
            print(f"🔄 Rollback command: python promote_to_prod.py --rollback {result['old_production_base']}")
            sys.exit(0)
        else:
            print("\n❌ Production promotion failed")
            sys.exit(2)
            
    except Exception as e:
        print(f"\n💥 Promotion script failed: {e}")
        sys.exit(3)

if __name__ == "__main__":
    main()