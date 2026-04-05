from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: UUID
    api_token: Optional[str] = None # Only populated on generation or migration
    created_at: datetime
    plan: str
    role: str
    monthly_quota: int
    messages_sent_month: int
    otp_template: str
    greeting_text: str
    notify_on_fail: str
    notify_email: Optional[str] = None
    account_protection: str
    interaction_strategy: str
    interaction_question: str
    interaction_keywords: str
    sleep_cycles: str
    spintax_enabled: str
    spintax_1: str
    spintax_2: str
    spintax_3: str
    smart_rotation: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str # New field for sliding sessions
    token_type: str = "bearer"


class APIKeyResponse(BaseModel):
    api_token: str
    is_token_masked: bool
    plan: str
    monthly_quota: int
    messages_sent_month: int
    otp_template: str
    greeting_text: str


class SendOTPRequest(BaseModel):
    phone: str
    code: str
    name: Optional[str] = None  # اسم المستلم لتخصيص الرسالة


class SendOTPResponse(BaseModel):
    success: bool
    message_id: Optional[str] = None
    status: str
    error: Optional[str] = None


class MessageLog(BaseModel):
    id: UUID
    phone: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedMessagesResponse(BaseModel):
    items: List[MessageLog]
    total: int
    page: int
    page_size: int


class WhatsAppStatusResponse(BaseModel):
    status: str
    device_id: Optional[str] = None
    connected_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    last_status_check_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WhatsAppQRResponse(BaseModel):
    status: str
    qr: Optional[str] = None
    message: Optional[str] = None


class DailyStat(BaseModel):
    date: str
    count: int


class DashboardStats(BaseModel):
    total_messages: int
    success_rate: float
    active_sessions: int
    monthly_usage: str
    plan: str
    recent_activity: List[MessageLog]
    daily_stats: List[DailyStat] = []


class UserAdminUpdate(BaseModel):
    plan: Optional[str] = None
    monthly_quota: Optional[int] = None
    role: Optional[str] = None
    otp_template: Optional[str] = None


class UserSettingsUpdate(BaseModel):
    otp_template: Optional[str] = None
    greeting_text: Optional[str] = None
    notify_on_fail: Optional[str] = None
    notify_email: Optional[str] = None
    account_protection: Optional[str] = None
    interaction_strategy: Optional[str] = None
    interaction_question: Optional[str] = None
    interaction_keywords: Optional[str] = None
    sleep_cycles: Optional[str] = None
    spintax_enabled: Optional[str] = None
    spintax_1: Optional[str] = None
    spintax_2: Optional[str] = None
    spintax_3: Optional[str] = None
    smart_rotation: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class NotificationSettingsUpdate(BaseModel):
    notify_on_fail: str  # "true" / "false"
    notify_email: Optional[str] = None


class SmtpSettings(BaseModel):
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = ""


class UserDetailedResponse(UserResponse):
    sessions: List[WhatsAppStatusResponse]
    messages: List[MessageLog]

    class Config:
        from_attributes = True


class SubscriptionPlanBase(BaseModel):
    name: str
    price: str
    description: Optional[str] = None
    features: List[str] = []
    monthly_quota: int = 100
    is_featured: bool = False


class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass


class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    monthly_quota: Optional[int] = None
    is_featured: Optional[bool] = None


class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TranslationBase(BaseModel):
    key: str
    en: str
    ar: str
    ru: str


class TranslationCreate(TranslationBase):
    pass


class TranslationUpdate(BaseModel):
    en: Optional[str] = None
    ar: Optional[str] = None
    ru: Optional[str] = None


class TranslationResponse(TranslationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
