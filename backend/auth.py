import bcrypt
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import secrets
from cryptography.fernet import Fernet
from config import settings

# Use settings from config.py
SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# 🔐 API Token Reversible Encryption (Fernet)
TOKEN_CIPHER = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode())

def encrypt_token(token: str) -> str:
    """Encrypts a token using Fernet."""
    if not token: return ""
    return TOKEN_CIPHER.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypts a token using Fernet. Returns empty string if failed."""
    if not encrypted_token or len(encrypted_token) < 10: return ""
    try:
        return TOKEN_CIPHER.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return ""

def hash_token(token: str) -> str:
    """Returns a SHA-256 hash of the token."""
    return hashlib.sha256(token.encode()).hexdigest()

def generate_secure_token(prefix: str = "ot_") -> str:
    """Generates a secure plaintext token."""
    return f"{prefix}{secrets.token_hex(20)}"

def _get_pre_hashed_password(password: str) -> bytes:
    """Hash password with SHA256 to ensure it's always stable and safe for bcrypt."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            _get_pre_hashed_password(plain_password),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(_get_pre_hashed_password(password), salt)
    return hashed.decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
