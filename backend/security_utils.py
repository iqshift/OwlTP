from cryptography.fernet import Fernet
from config import settings
import base64
import os

# Initialize Fernet only if key is available
def _get_encryption_tool():
    key = settings.SMTP_ENCRYPTION_KEY
    if not key:
        return None
    return Fernet(key.encode())

def encrypt_secret(plain_text: str) -> str:
    """Encrypts a string (e.g. SMTP Password) using Fernet."""
    tool = _get_encryption_tool()
    if not tool:
        return plain_text # Fallback for dev if not set
    return tool.encrypt(plain_text.encode()).decode()

def decrypt_secret(encrypted_text: str) -> str:
    """Decrypts a Fernet encrypted string."""
    tool = _get_encryption_tool()
    if not tool:
        return encrypted_text # Fallback for dev
    try:
        return tool.decrypt(encrypted_text.encode()).decode()
    except Exception:
        return encrypted_text # Assume plaintext if decryption fails (migration helper)

def generate_fernet_key() -> str:
    """One-time utility to generate a key for .env"""
    return Fernet.generate_key().decode()

if __name__ == "__main__":
    print(f"Generated KEY: {generate_fernet_key()}")
