from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
import json
from database import Base

class SessionStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    AUTHENTICATING = "authenticating"
    QR_READY = "qr_ready"


class Plan(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    api_token = Column(String, unique=True, index=True, nullable=True) # Plaintext (Will be nullified after migration)
    api_token_hashed = Column(String, unique=True, index=True, nullable=True) # SHA-256 Hash
    role = Column(String, default=UserRole.USER.value, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ... existing Plan & usage tracking ...

    # Plan & usage tracking (per billing period)
    plan = Column(String, default=Plan.FREE.value, nullable=False)
    monthly_quota = Column(Integer, default=100, nullable=False)
    messages_sent_month = Column(Integer, default=0, nullable=False)
    billing_period_start = Column(DateTime(timezone=True), server_default=func.now())
    otp_template = Column(String, default="Your verification code is: {code}", nullable=False)
    greeting_text = Column(String, default="Hello", nullable=False)
    notify_on_fail = Column(String, default="false", nullable=False)
    notify_email = Column(String, nullable=True)
    max_sessions = Column(Integer, default=1, nullable=False)  # 1=Free, 3=Pro, 10=Enterprise
    
    # Anti-Ban Protection Settings
    account_protection = Column(String, default="false", nullable=False) # randomized delays, human-like typing
    interaction_strategy = Column(String, default="false", nullable=False) # 2-step OTP (Yes/No)
    interaction_question = Column(Text, default="Hello {name}, did you request an OwlTP verification code? Reply with (Yes) to receive it.", nullable=False)
    interaction_keywords = Column(Text, default="yes,ok,confirm,yep,yeah,y,sure", nullable=False)
    sleep_cycles = Column(String, default="false", nullable=False) # Stop between 2-7 AM
    spintax_enabled = Column(String, default="false", nullable=False) # Message variation
    spintax_1 = Column(Text, default="Hello {name}, your code is: {code}", nullable=False)
    spintax_2 = Column(Text, default="OTP: {code} is your verification code. Do not share it.", nullable=False)
    spintax_3 = Column(Text, default="Your login code is {code}. Thank you for using OwlTP.", nullable=False)
    smart_rotation = Column(String, default="false", nullable=False) # Dynamic rotation


class WhatsAppSession(Base):
    __tablename__ = "whatsapp_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_path = Column(String, nullable=False)
    status = Column(String, default=SessionStatus.DISCONNECTED.value, nullable=False)
    connected_at = Column(DateTime(timezone=True), nullable=True)

    device_id = Column(String, nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_status_check_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    phone = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="queued", nullable=False)  # queued, sent, failed
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OTPRequest(Base):
    """Stores pending OTP requests waiting for user confirmation (Interaction Strategy)"""
    __tablename__ = "otp_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    phone = Column(String, nullable=False)
    name = Column(String, nullable=True) # الاسم المستهدف للتخصيص
    code = Column(String, nullable=False)
    template = Column(Text, nullable=False)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True) # التتبع في السجلات
    status = Column(String, default="pending", nullable=False) # pending, confirmed, expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False) # e.g. "Free", "Pro", "Enterprise"
    price = Column(String, nullable=False) # e.g. "$0", "$29", "Custom"
    description = Column(String, nullable=True) # e.g. "Perfect for testing"
    features_json = Column(Text, default="[]") # Stored as JSON string
    monthly_quota = Column(Integer, default=100)
    is_featured = Column(Integer, default=0) # 1 if featured, 0 otherwise
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def features(self):
        return json.loads(self.features_json)

    @features.setter
    def features(self, value):
        self.features_json = json.dumps(value)


class Translation(Base):
    __tablename__ = "translations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, index=True, nullable=False)
    en = Column(Text, nullable=False)
    ar = Column(Text, nullable=False) # Arabic (Iraq)
    ru = Column(Text, nullable=False) # Russian
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SystemSettings(Base):
    """Key-value store for system-wide settings like SMTP config"""
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked = Column(Integer, default=0) # 1 if revoked
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # None for system/anon
    action = Column(String, index=True, nullable=False) # e.g. "AUTH_LOGIN", "REGENERATE_TOKEN"
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    metadata_json = Column(Text, nullable=True) # Extra context
    created_at = Column(DateTime(timezone=True), server_default=func.now())
