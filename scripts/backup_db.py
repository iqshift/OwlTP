import os
import sys
import subprocess
from datetime import datetime

# Add backend to path to use config and security_utils
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from config import settings
from security_utils import encrypt_secret

def run_backup():
    print(f"[{datetime.now()}] Starting Encrypted Backup Phase V99...")
    
    # 1. Prepare Paths
    backup_dir = os.path.join(os.path.dirname(__file__), "..", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    plain_sql = os.path.join(backup_dir, f"backup_{timestamp}.sql")
    encrypted_sql = os.path.join(backup_dir, f"backup_{timestamp}.sql.enc")
    
    # 2. Extract DB Params from DATABASE_URL
    # Format: postgresql://admin:password123@db:5432/whatsapp_otp
    url = settings.DATABASE_URL
    
    try:
        # We'll use the pg_dump command directly if available in the environment
        print(f"DEBUG: Running pg_dump...")
        env = os.environ.copy()
        # Extract password if present to avoid prompt
        # (This is simplified, in real prod use PGPASSWORD env)
        
        process = subprocess.run(
            ["pg_dump", url, "-f", plain_sql],
            capture_output=True,
            text=True
        )
        
        if process.returncode != 0:
            print(f"ERROR: pg_dump failed: {process.stderr}")
            return

        # 3. Encrypt the file
        print(f"DEBUG: Encrypting backup...")
        with open(plain_sql, "r", encoding="utf-8") as f:
            content = f.read()
            
        encrypted_content = encrypt_secret(content)
        
        with open(encrypted_sql, "w", encoding="utf-8") as f:
            f.write(encrypted_content)
            
        # 4. Cleanup plaintext
        os.remove(plain_sql)
        
        print(f"SUCCESS: Encrypted backup saved to {encrypted_sql}")
        
    except Exception as e:
        print(f"FATAL: Backup failed: {e}")

if __name__ == "__main__":
    run_backup()
