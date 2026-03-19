from datetime import datetime, timezone, timedelta
import uuid
import io
import base64
import qrcode
import time
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Security, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import JWTError, jwt
from sqlalchemy import text, func
from sqlalchemy.orm import Session

import models, schemas, auth, database, whatsapp_service, redis_client, email_service


app = FastAPI(title="WhatsApp OTP API Platform")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models creation (In production use migrations)
models.Base.metadata.create_all(bind=database.engine)


@app.on_event("startup")
def init_plans():
    db = database.SessionLocal()
    try:
        if db.query(models.SubscriptionPlan).count() == 0:
            print("INFO: Initializing default subscription plans...")
            plans = [
                models.SubscriptionPlan(
                    name="Free", price="$0", description="Perfect for testing",
                    monthly_quota=100, is_featured=0
                ),
                models.SubscriptionPlan(
                    name="Pro", price="$29", description="For growing businesses",
                    monthly_quota=5000, is_featured=1
                ),
                models.SubscriptionPlan(
                    name="Enterprise", price="Custom", description="Scale without limits",
                    monthly_quota=0, is_featured=0
                )
            ]
            # Set features list using the property setter in models.py
            plans[0].features = ["100 messages/mo", "1 WhatsApp Session", "Community support", "Basic API Access"]
            plans[1].features = ["5000 messages/mo", "3 WhatsApp Sessions", "Round-Robin Sending", "Priority support"]
            plans[2].features = ["Unlimited messages", "10 WhatsApp Sessions", "Load Balancing", "Dedicated account manager"]
            
            db.add_all(plans)
            db.commit()
            print("INFO: Default plans initialized successfully.")
    except Exception as e:
        print(f"ERROR: Failed to initialize plans: {e}")
    finally:
        db.close()


@app.on_event("startup")
def init_translations():
    db = database.SessionLocal()
    try:
        if db.query(models.Translation).count() == 0:
            print("INFO: Initializing default translations...")
            translations = [
                # Navbar
                models.Translation(key="nav_features", en="Features", ar="المميزات", ru="Функции"),
                models.Translation(key="nav_pricing", en="Pricing", ar="الأسعار", ru="Цены"),
                models.Translation(key="nav_about", en="About", ar="حول", ru="О нас"),
                models.Translation(key="nav_login", en="Login", ar="تسجيل الدخول", ru="Вход"),
                models.Translation(key="nav_register", en="Get Started", ar="ابدأ الآن", ru="Начать"),
                
                # Hero
                models.Translation(key="hero_badge", en="New: Multi-language SDKs support", ar="جديد: دعم برمجيات متعددة اللغات", ru="Новинка: поддержка многоязычных SDK"),
                models.Translation(key="hero_title_1", en="Send OTPs via", ar="أرسل رموز التحقق عبر", ru="Отправляйте OTP через"),
                models.Translation(key="hero_title_2", en="WhatsApp", ar="واتساب", ru="WhatsApp"),
                models.Translation(key="hero_desc", en="Scalable, reliable, and production-ready API for your business.", ar="واجهة برمجية قابلة للتوسع وموثوقة وجاهزة للإنتاج لعملك.", ru="Масштабируемый, надежный и готовый к работе API для вашего бизнеса."),
                models.Translation(key="hero_cta_trial", en="Start Free Trial", ar="ابدأ التجربة المجانية", ru="Начать пробный период"),
                models.Translation(key="hero_cta_docs", en="View API Docs", ar="عرض وثائق الـ API", ru="Документация API"),
                
                # Features
                models.Translation(key="feat_section_title", en="Everything you need to scale", ar="كل ما تحتاجه للتوسع", ru="Все, что нужно для масштабирования"),
                models.Translation(key="feat_section_desc", en="Built for developers who demand speed and reliability.", ar="بنيت للمطورين الذين يطلبون السرعة والموثوقية.", ru="Создано для разработчиков, которым важны скорость и надежность."),
                
                # Pricing
                models.Translation(key="price_section_title", en="Simple, transparent pricing", ar="أسعار بسيطة وشفافة", ru="Простые и прозрачные цены"),
                models.Translation(key="price_section_desc", en="Choose the plan that fits your growth.", ar="اختر الخطة التي تناسب نموك.", ru="Выберите план, который подходит для вашего роста."),
                                # Common
                 models.Translation(key="common_loading_plans", en="Loading Plans...", ar="جاري تحميل الخطط...", ru="Загрузка планов..."),
                 
                 # Login Page
                 models.Translation(key="login_title", en="Sign in", ar="تسجيل الدخول", ru="Войти"),
                 models.Translation(key="login_desc", en="Access your WhatsApp OTP dashboard.", ar="الدخول إلى لوحة تحكم رموز التحقق عبر واتساب.", ru="Доступ к панели OTP WhatsApp."),
                 models.Translation(key="login_email_label", en="Email", ar="البريد الإلكتروني", ru="Email"),
                 models.Translation(key="login_password_label", en="Password", ar="كلمة المرور", ru="Пароль"),
                 models.Translation(key="login_button", en="Sign in", ar="تسجيل الدخول", ru="Войти"),
                 models.Translation(key="login_button_loading", en="Signing in...", ar="جاري الدخول...", ru="Вход..."),
                 models.Translation(key="login_failed", en="Login failed", ar="فشل تسجيل الدخول", ru="Ошибка входа"),
                 models.Translation(key="login_footer_text", en="Don't have an account?", ar="ليس لديك حساب؟", ru="Нет аккаунта?"),
                 models.Translation(key="login_footer_link", en="Sign up", ar="سجل الآن", ru="Регистрация"),

                 # Register Page
                 models.Translation(key="reg_title", en="Create an account", ar="إنشاء حساب جديد", ru="Создать аккаунт"),
                 models.Translation(key="reg_desc", en="Start sending OTPs via WhatsApp today.", ar="ابدأ في إرسال رموز التحقق عبر واتساب اليوم.", ru="Начните отправлять OTP через WhatsApp сегодня."),
                 models.Translation(key="reg_name_label", en="Full Name", ar="الاسم الكامل", ru="Полное имя"),
                 models.Translation(key="reg_email_label", en="Email", ar="البريد الإلكتروني", ru="Email"),
                 models.Translation(key="reg_password_label", en="Password", ar="كلمة المرور", ru="Пароль"),
                 models.Translation(key="reg_button", en="Create Account", ar="إنشاء الحساب", ru="Создать"),
                 models.Translation(key="reg_button_loading", en="Creating account...", ar="جاري الإنشاء...", ru="Создание..."),
                 models.Translation(key="reg_failed", en="Registration failed", ar="فشل إنشاء الحساب", ru="Ошибка регистрации"),
                 models.Translation(key="reg_footer_text", en="Already have an account?", ar="لديك حساب بالفعل؟", ru="Уже есть аккаунт?"),
                 models.Translation(key="reg_footer_link", en="Sign in", ar="تسجيل الدخول", ru="Войти"),
             ]
            db.add_all(translations)
            db.commit()
            print("INFO: Default translations initialized successfully.")
    except Exception as e:
        print(f"ERROR: Failed to initialize translations: {e}")
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

ws = whatsapp_service.WhatsAppService()

# Global in-memory cache to prevent rapid QR rotation per user
# Format: {user_id: {"qr": str, "expires_at": float}}
qr_memory_cache = {}


PLAN_DEFAULT_QUOTAS = {
    models.Plan.FREE.value: 100,
    models.Plan.PRO.value: 5000,
    models.Plan.ENTERPRISE.value: 0,  # treated as unlimited
}

# Max WhatsApp sessions per plan
PLAN_SESSION_LIMITS = {
    models.Plan.FREE.value: 1,
    models.Plan.PRO.value: 3,
    models.Plan.ENTERPRISE.value: 10,
}


def _get_smtp_settings(db: Session) -> dict:
    """Load SMTP settings from system_settings table."""
    keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "from_email"]
    settings = {}
    for key in keys:
        row = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
        settings[key] = row.value if row else ""
    return settings


def _send_fail_notification_if_configured(db: Session, to_email: str, phone: str, error=None):
    """Send fail notification email using configured SMTP settings (best-effort)."""
    smtp = _get_smtp_settings(db)
    if not smtp.get("smtp_host") or not smtp.get("smtp_user"):
        return  # SMTP not configured, skip silently
    try:
        port = int(smtp.get("smtp_port") or 587)
        email_service.send_fail_notification(
            smtp_host=smtp["smtp_host"],
            smtp_port=port,
            smtp_user=smtp["smtp_user"],
            smtp_password=smtp.get("smtp_password", ""),
            from_email=smtp.get("from_email") or smtp["smtp_user"],
            to_email=to_email,
            phone=phone,
            error=error,
        )
    except Exception:
        pass


def ensure_billing_period(user: models.User) -> None:
    """
    Reset monthly usage when billing period crosses a month boundary.
    Simple implementation: if month/year changed -> reset counter.
    """
    if not user.billing_period_start:
        user.billing_period_start = datetime.now(timezone.utc)
        user.messages_sent_month = 0
        return

    now = datetime.now(timezone.utc)
    if (
        user.billing_period_start.year != now.year
        or user.billing_period_start.month != now.month
    ):
        user.billing_period_start = now
        # set quota based on plan if not explicitly overridden
        default_quota = PLAN_DEFAULT_QUOTAS.get(user.plan, 100)
        if default_quota:
            user.monthly_quota = default_quota
        user.messages_sent_month = 0


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            print("DEBUG: Token validation failed: 'sub' claim missing.")
            raise credentials_exception
    except JWTError as e:
        print(f"DEBUG: Token validation failed (JWTError): {e}")
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        print(f"DEBUG: Token validation failed: User {user_id} not found in DB.")
        raise credentials_exception
    return user


def get_admin_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    raw_role = str(current_user.role).strip().lower()
    expected_role = str(models.UserRole.ADMIN.value).strip().lower()
    
    print(f"DEBUG: Checking admin privileges for {current_user.email}")
    print(f"DEBUG: DB Role: '{current_user.role}' (clean: '{raw_role}'), Expected: '{expected_role}'")
    
    if raw_role != expected_role:
        print(f"DEBUG: Access DENIED for {current_user.email} - Role mismatch")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges"
        )
    print(f"DEBUG: Access GRANTED for {current_user.email}")
    return current_user


@app.on_event("startup")
def create_admin():
    db = next(database.get_db())
    try:
        # Automatic Migration for existing DBs
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_template VARCHAR DEFAULT 'Your OTP code is: {code}' NOT NULL;"))
        db.commit()
    except Exception as e:
        print(f"INFO: Database migration/check: {e}")
        db.rollback()

    try:
        admin = db.query(models.User).filter(models.User.email == "admin@owltp.com").first()
        if not admin:
            from auth import get_password_hash
            new_admin = models.User(
                email="admin@owltp.com",
                password_hash=get_password_hash("admin123"),
                api_token=f"admin-{uuid.uuid4().hex}",
                role=models.UserRole.ADMIN.value,
                plan=models.Plan.ENTERPRISE.value,
                monthly_quota=0 # unlimited
            )
            db.add(new_admin)
            db.commit()
            print("Admin user created: admin@owltp.com / admin123")
    finally:
        db.close()


@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pass = auth.get_password_hash(user.password)
    api_token = "ot_" + uuid.uuid4().hex

    new_user = models.User(
        email=user.email,
        password_hash=hashed_pass,
        api_token=api_token,
        plan=models.Plan.FREE.value,
        monthly_quota=PLAN_DEFAULT_QUOTAS[models.Plan.FREE.value],
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = auth.create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=access_token)


@app.get("/me", response_model=schemas.UserResponse)
def read_me(current_user: models.User = Depends(get_current_user)):
    ensure_billing_period(current_user)
    print(f"DEBUG: Returning info for {current_user.email}, Role: {current_user.role}")
    return current_user


@app.get("/api/keys", response_model=schemas.APIKeyResponse)
def get_api_key(current_user: models.User = Depends(get_current_user)):
    ensure_billing_period(current_user)
    return schemas.APIKeyResponse(
        api_token=current_user.api_token,
        plan=current_user.plan,
        monthly_quota=current_user.monthly_quota,
        messages_sent_month=current_user.messages_sent_month,
        otp_template=current_user.otp_template,
        greeting_text=current_user.greeting_text or "مرحبا",
    )


@app.post("/api/settings", response_model=schemas.UserResponse)
def update_settings(
    settings: schemas.UserSettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    current_user.otp_template = settings.otp_template
    if settings.greeting_text is not None:
        current_user.greeting_text = settings.greeting_text
    if settings.notify_on_fail is not None:
        current_user.notify_on_fail = settings.notify_on_fail
    if settings.notify_email is not None:
        current_user.notify_email = settings.notify_email
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/api/settings/password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    if not auth.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل")
    current_user.password_hash = auth.hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"success": True, "message": "تم تغيير كلمة المرور بنجاح"}


@app.post("/api/settings/notifications", response_model=schemas.UserResponse)
def update_notifications(
    payload: schemas.NotificationSettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    current_user.notify_on_fail = payload.notify_on_fail
    if payload.notify_email is not None:
        current_user.notify_email = payload.notify_email
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/api/keys/regenerate", response_model=schemas.APIKeyResponse)
def regenerate_api_key(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    current_user.api_token = "ot_" + uuid.uuid4().hex
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    ensure_billing_period(current_user)
    return schemas.APIKeyResponse(
        api_token=current_user.api_token,
        plan=current_user.plan,
        monthly_quota=current_user.monthly_quota,
        messages_sent_month=current_user.messages_sent_month,
        otp_template=current_user.otp_template,
    )


@app.post("/api/send", response_model=schemas.SendOTPResponse)
def send_otp(
    payload: schemas.SendOTPRequest,
    authorization: str = Security(api_key_header),
    db: Session = Depends(database.get_db),
):
    # API token authentication
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid API Token")

    token = authorization.split(" ")[1]
    user = db.query(models.User).filter(models.User.api_token == token).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid API Token")

    # Enforce per-token rate limit: 30 messages / minute
    if not redis_client.check_rate_limit(token, limit_per_minute=30):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded: 30 messages per minute",
        )

    # Enforce plan monthly quota
    ensure_billing_period(user)
    if user.plan != models.Plan.ENTERPRISE.value and user.messages_sent_month >= user.monthly_quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Monthly message quota exceeded for your plan",
        )

    # Prevent parallel send conflicts with a simple Redis lock per user
    r = redis_client.get_redis()
    lock_key = f"sendlock:{user.id}"
    if not r.set(lock_key, "1", nx=True, ex=30):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Another send operation is in progress for this account",
        )

    # Validate code is numeric
    if not payload.code.isdigit():
        raise HTTPException(status_code=400, detail="OTP code must contain digits only")

    # Build final message:
    # {greeting} {name}\n{otp_template}\n{code}
    greeting = user.greeting_text or "مرحبا"
    template = user.otp_template or "كود التحقق الخاص بك هو: "

    if payload.name:
        final_message = f"{greeting} {payload.name}\n{template}\n{payload.code}"
    else:
        final_message = f"{template}\n{payload.code}"

    try:
        # Pick best session using round-robin
        chosen_session = _pick_session_round_robin(db, user, r)
        session_suffix = ""
        # Determine the suffix from session_path to pass correct user_id to CLI
        all_sessions = _get_all_sessions(db, user)
        si = all_sessions.index(chosen_session) if chosen_session in all_sessions else 0
        cli_user_id = str(user.id) + (f"_{si}" if si > 0 else "")
        result = ws.send_message(cli_user_id, payload.phone, final_message)
    finally:
        r.delete(lock_key)

    # Log message
    msg_status = "sent" if result.get("success") else "failed"
    new_msg = models.Message(
        user_id=user.id,
        phone=payload.phone,
        message=final_message,
        status=msg_status,
    )
    user.messages_sent_month = (user.messages_sent_month or 0) + 1 if msg_status == "sent" else user.messages_sent_month

    db.add(new_msg)
    db.add(user)
    db.commit()
    db.refresh(new_msg)

    # Send fail notification if enabled
    if msg_status == "failed" and user.notify_on_fail == "true" and user.notify_email:
        try:
            _send_fail_notification_if_configured(db, user.notify_email, payload.phone, result.get("error"))
        except Exception:
            pass  # Never block the response due to notification failure

    if not result.get("success"):
        return schemas.SendOTPResponse(
            success=False,
            status="failed",
            error=result.get("error"),
        )

    return schemas.SendOTPResponse(success=True, status="sent", message_id=str(new_msg.id))


@app.get("/api/logs", response_model=schemas.PaginatedMessagesResponse)
def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    query = db.query(models.Message).filter(models.Message.user_id == current_user.id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.Message.phone.ilike(like))
            | (models.Message.message.ilike(like))
        )

    total = query.count()
    items = (
        query.order_by(models.Message.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return schemas.PaginatedMessagesResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


def _get_or_create_session(db: Session, user: models.User, session_index: int = 0) -> models.WhatsAppSession:
    """
    Get the session at index `session_index` for the user.
    If it doesn't exist, create it (up to plan limit).
    """
    sessions = (
        db.query(models.WhatsAppSession)
        .filter(models.WhatsAppSession.user_id == user.id)
        .order_by(models.WhatsAppSession.created_at)
        .all()
    )
    if session_index < len(sessions):
        return sessions[session_index]

    # Create new — append index suffix so CLI treats as separate session dir
    suffix = f"_{session_index}" if session_index > 0 else ""
    session_path = ws.get_session_dir(str(user.id) + suffix)
    session = models.WhatsAppSession(
        user_id=user.id,
        session_path=session_path,
        status=models.SessionStatus.DISCONNECTED.value,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _get_all_sessions(db: Session, user: models.User) -> list:
    return (
        db.query(models.WhatsAppSession)
        .filter(models.WhatsAppSession.user_id == user.id)
        .order_by(models.WhatsAppSession.created_at)
        .all()
    )


def _pick_session_round_robin(db: Session, user: models.User, r) -> models.WhatsAppSession:
    """
    Returns the best available (connected) session using round-robin via Redis counter.
    Falls back to first session if none are connected.
    """
    sessions = _get_all_sessions(db, user)
    connected = [s for s in sessions if s.status == models.SessionStatus.CONNECTED.value]

    if not connected:
        # Nothing connected — return first session for error reporting
        return sessions[0] if sessions else _get_or_create_session(db, user, 0)

    if len(connected) == 1:
        return connected[0]

    # Round-robin using Redis counter
    rr_key = f"rr:{user.id}"
    idx = int(r.incr(rr_key)) % len(connected)
    r.expire(rr_key, 86400)  # TTL 1 day
    return connected[idx]


def _sync_session_status(db: Session, session: models.WhatsAppSession, user: models.User, session_index: int):
    """Refreshes the session status in DB by calling the CLI actively."""
    suffix = f"_{session_index}" if session_index > 0 else ""
    user_id_str = str(user.id) + suffix
    
    # We check CLI if:
    # 1. DB says connected (to verify it's still true)
    # 2. DB says disconnected BUT it's been more than 30s since last check (to see if it reconnected)
    # 3. DB says disconnected BUT we are in an active session (last_status_check_at is recent)
    
    should_check = False
    if session.status == models.SessionStatus.CONNECTED.value:
        should_check = True
    else:
        # If disconnected, check if we haven't checked in a while or if we want to be proactive
        last_check = session.last_status_check_at or datetime.min.replace(tzinfo=timezone.utc)
        if (datetime.now(timezone.utc) - last_check).total_seconds() > 10: # Check every 10s if requested
            should_check = True

    if should_check:
        result = ws.get_status(user_id_str)
        if result.get("success"):
            new_status = result.get("status")
            if new_status and new_status != session.status:
                # IMPORTANT: If DB says qr_ready, but CLI says disconnected, it's NORMAL.
                # Don't revert to disconnected unless the engine is actually down or we want to reset.
                if session.status == models.SessionStatus.QR_READY.value and new_status == models.SessionStatus.DISCONNECTED.value:
                    pass 
                else:
                    print(f"DEBUG: Status mismatch for {user.email}: DB={session.status}, CLI={new_status}. Updating DB.")
                    session.status = new_status
                    if new_status == models.SessionStatus.CONNECTED.value:
                        session.connected_at = session.connected_at or datetime.now(timezone.utc)
                    db.add(session)
                    db.commit()
        elif any(k in str(result.get("error")).lower() for k in ["not authenticated", "not logged in", "logged out", "stream error", "disconnected"]):
            print(f"DEBUG: Connection lost or not established for {user.email}. CLI Error: {result.get('error')}. Reverting DB to DISCONNECTED.")
            if session.status != models.SessionStatus.DISCONNECTED.value:
                session.status = models.SessionStatus.DISCONNECTED.value
                db.add(session)
                db.commit()
                db.commit()

@app.get("/api/whatsapp/status", response_model=schemas.WhatsAppStatusResponse)
def whatsapp_status(
    session_index: int = Query(0),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    session = _get_or_create_session(db, current_user, session_index)
    _sync_session_status(db, session, current_user, session_index)

    return schemas.WhatsAppStatusResponse(
        status=session.status,
        device_id=session.device_id,
        connected_at=session.connected_at,
        last_sync_at=session.last_sync_at,
        last_status_check_at=datetime.now(timezone.utc),
        last_error=session.last_error,
        created_at=session.created_at,
    )


@app.get("/api/whatsapp/qr", response_model=schemas.WhatsAppQRResponse)
def get_qr(
    force: bool = Query(False),
    session_index: int = Query(0),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    session = _get_or_create_session(db, current_user, session_index)
    _sync_session_status(db, session, current_user, session_index)

    # Build the CLI user_id — session 0 = plain user_id, session N = user_id_N
    suffix = f"_{session_index}" if session_index > 0 else ""
    user_id_str = str(current_user.id) + suffix

    result = ws.get_auth_qr(user_id_str, force_restart=force)
    qr = result.get("qr")
    status_str = result.get("status") or session.status

    session.last_status_check_at = datetime.now(timezone.utc)
    session.status = status_str

    if result.get("success") and status_str == models.SessionStatus.CONNECTED.value:
        session.connected_at = datetime.now(timezone.utc)
        session.last_error = None
    elif not result.get("success"):
        session.last_error = result.get("error")

    db.add(session)
    db.commit()

    return schemas.WhatsAppQRResponse(
        status=status_str,
        qr=qr,
        message=result.get("message"),
    )


@app.post("/api/whatsapp/reset")
def reset_whatsapp(
    session_index: int = Query(0),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Forcefully stops any pending authentication and resets the session status.
    """
    suffix = f"_{session_index}" if session_index > 0 else ""
    user_id_str = str(current_user.id) + suffix
    ws.stop_auth(user_id_str, deep_clean=True)
    
    session = _get_or_create_session(db, current_user, session_index)
    session.status = models.SessionStatus.DISCONNECTED.value
    db.add(session)
    db.commit()
    
    return {"success": True, "message": "Authentication reset. You can now try again."}


@app.get("/api/whatsapp/sessions", response_model=List[schemas.WhatsAppStatusResponse])
def get_all_user_sessions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get all WhatsApp sessions for the current user."""
    sessions = _get_all_sessions(db, current_user)
    if not sessions:
        # Create default first session
        sessions = [_get_or_create_session(db, current_user, 0)]
    
    # Refresh status for all sessions before returning
    for idx, s in enumerate(sessions):
        _sync_session_status(db, s, current_user, idx)
    
    return [
        schemas.WhatsAppStatusResponse(
            status=s.status,
            device_id=s.device_id,
            connected_at=s.connected_at,
            last_sync_at=s.last_sync_at,
            last_status_check_at=s.last_status_check_at,
            last_error=s.last_error,
        )
        for s in sessions
    ]


@app.post("/api/whatsapp/sessions/add")
def add_whatsapp_session(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Add a new WhatsApp session (subject to plan limit)."""
    max_allowed = PLAN_SESSION_LIMITS.get(current_user.plan, 1)
    existing = _get_all_sessions(db, current_user)

    if len(existing) >= max_allowed:
        raise HTTPException(
            status_code=403,
            detail=f"خطتك الحالية تسمح بـ {max_allowed} جلسة فقط. قم بالترقية للحصول على المزيد.",
        )

    new_idx = len(existing)
    new_session = _get_or_create_session(db, current_user, new_idx)
    return {
        "success": True,
        "message": f"تم إنشاء الجلسة {new_idx + 1}",
        "session_index": new_idx,
        "max_sessions": max_allowed,
    }


@app.delete("/api/whatsapp/sessions/{session_index}")
def delete_whatsapp_session(
    session_index: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Delete a session by index (cannot delete the primary session 0)."""
    if session_index == 0:
        raise HTTPException(status_code=400, detail="لا يمكن حذف الجلسة الأساسية")

    sessions = _get_all_sessions(db, current_user)
    if session_index >= len(sessions):
        raise HTTPException(status_code=404, detail="الجلسة غير موجودة")

    session = sessions[session_index]
    suffix = f"_{session_index}"
    ws.stop_auth(str(current_user.id) + suffix, deep_clean=True)
    db.delete(session)
    db.commit()
    return {"success": True, "message": "تم حذف الجلسة"}



@app.get("/api/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    ensure_billing_period(current_user)
    
    total_messages = db.query(models.Message).filter(models.Message.user_id == current_user.id).count()
    sent_messages = db.query(models.Message).filter(
        models.Message.user_id == current_user.id,
        models.Message.status == "sent"
    ).count()
    
    success_rate = (sent_messages / total_messages * 100) if total_messages > 0 else 100.0
    
    active_sessions = db.query(models.WhatsAppSession).filter(
        models.WhatsAppSession.user_id == current_user.id,
        models.WhatsAppSession.status == models.SessionStatus.CONNECTED.value
    ).count()
    
    monthly_usage = f"{current_user.messages_sent_month} / {current_user.monthly_quota}"
    if current_user.monthly_quota == 0:
        monthly_usage = f"{current_user.messages_sent_month} / ∞"
        
    recent_activity = db.query(models.Message).filter(
        models.Message.user_id == current_user.id
    ).order_by(models.Message.created_at.desc()).limit(5).all()

    # Calculate daily stats for the last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    daily_results = db.query(
        func.date(models.Message.created_at).label('date'),
        func.count(models.Message.id).label('count')
    ).filter(
        models.Message.user_id == current_user.id,
        models.Message.created_at >= seven_days_ago
    ).group_by(func.date(models.Message.created_at)).all()

    # Fill in missing dates with zero
    stats_dict = {str(r.date): r.count for r in daily_results}
    daily_stats = []
    for i in range(8):
        d = (datetime.now(timezone.utc) - timedelta(days=7-i)).date()
        date_str = str(d)
        daily_stats.append(schemas.DailyStat(
            date=d.strftime("%b %d"), 
            count=stats_dict.get(date_str, 0)
        ))
    
    return schemas.DashboardStats(
        total_messages=total_messages,
        success_rate=round(success_rate, 1),
        active_sessions=active_sessions,
        monthly_usage=monthly_usage,
        plan=current_user.plan.capitalize(),
        recent_activity=recent_activity,
        daily_stats=daily_stats
    )


@app.post("/api/user/upgrade", response_model=schemas.UserResponse)
def upgrade_user_plan(
    plan_name: str = Query(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Allows a user to upgrade their own plan (simulated payment)."""
    # Normalize plan name
    plan_name = plan_name.lower()
    if plan_name not in PLAN_DEFAULT_QUOTAS:
        raise HTTPException(status_code=400, detail="Invalid plan name")
    
    current_user.plan = plan_name
    current_user.monthly_quota = PLAN_DEFAULT_QUOTAS.get(plan_name, 100)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def admin_get_users(
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.User).all()


@app.get("/api/admin/users/{user_id}", response_model=schemas.UserDetailedResponse)
def admin_get_user_details(
    user_id: uuid.UUID,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db)
):
    print(f"DEBUG: Admin {admin.email} fetching details for user_id: {user_id} (type: {type(user_id)})")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        print(f"DEBUG: User with ID {user_id} NOT FOUND in database")
        raise HTTPException(status_code=404, detail="User not found")
    print(f"DEBUG: Found user: {user.email}")
    
    sessions = db.query(models.WhatsAppSession).filter(models.WhatsAppSession.user_id == user_id).all()
    messages = db.query(models.Message).filter(models.Message.user_id == user_id).order_by(models.Message.created_at.desc()).limit(50).all()
    
    # Return as dict to allow FastAPI to handle serialization of ORM objects via UserDetailedResponse
    user_data = schemas.UserResponse.from_orm(user).dict()
    user_data["sessions"] = sessions
    user_data["messages"] = messages
    return user_data


@app.patch("/api/admin/users/{user_id}", response_model=schemas.UserResponse)
def admin_update_user(
    user_id: uuid.UUID,
    update_data: schemas.UserAdminUpdate,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update_data.plan is not None:
        user.plan = update_data.plan
        # Update default quota if plan changed
        if update_data.monthly_quota is None:
            user.monthly_quota = PLAN_DEFAULT_QUOTAS.get(update_data.plan, 100)
            
    if update_data.monthly_quota is not None:
        user.monthly_quota = update_data.monthly_quota
        
    if update_data.role is not None:
        user.role = update_data.role
        
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/plans", response_model=List[schemas.SubscriptionPlanResponse])
def get_plans(db: Session = Depends(database.get_db)):
    """Publicly accessible endpoint to get all subscription plans."""
    return db.query(models.SubscriptionPlan).order_by(models.SubscriptionPlan.created_at).all()


@app.post("/api/admin/plans", response_model=schemas.SubscriptionPlanResponse)
def admin_create_plan(
    plan: schemas.SubscriptionPlanCreate,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db)
):
    db_plan = models.SubscriptionPlan(
        name=plan.name,
        price=plan.price,
        description=plan.description,
        monthly_quota=plan.monthly_quota,
        is_featured=1 if plan.is_featured else 0
    )
    db_plan.features = plan.features
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.patch("/api/admin/plans/{plan_id}", response_model=schemas.SubscriptionPlanResponse)
def admin_update_plan(
    plan_id: uuid.UUID,
    update_data: schemas.SubscriptionPlanUpdate,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db)
):
    db_plan = db.query(models.SubscriptionPlan).filter(models.SubscriptionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if update_data.name is not None: db_plan.name = update_data.name
    if update_data.price is not None: db_plan.price = update_data.price
    if update_data.description is not None: db_plan.description = update_data.description
    if update_data.features is not None: db_plan.features = update_data.features
    if update_data.monthly_quota is not None: db_plan.monthly_quota = update_data.monthly_quota
    if update_data.is_featured is not None: db_plan.is_featured = 1 if update_data.is_featured else 0
    
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.delete("/api/admin/plans/{plan_id}")
def admin_delete_plan(
    plan_id: uuid.UUID,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db)
):
    db_plan = db.query(models.SubscriptionPlan).filter(models.SubscriptionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(db_plan)
    db.commit()
    return {"success": True}


# --- Translation Endpoints ---

@app.get("/api/translations/{lang}")
def get_translations_by_lang(lang: str, db: Session = Depends(database.get_db)):
    """Public endpoint to get translations for a specific language."""
    translations = db.query(models.Translation).all()
    result = {}
    for t in translations:
        if lang == "ar":
            result[t.key] = t.ar
        elif lang == "ru":
            result[t.key] = t.ru
        else:
            result[t.key] = t.en
    return result


@app.get("/api/admin/translations", response_model=List[schemas.TranslationResponse])
def get_all_translations_admin(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Admin endpoint to get all translation records."""
    return db.query(models.Translation).all()


@app.post("/api/admin/translations", response_model=schemas.TranslationResponse)
def upsert_translation(
    translation: schemas.TranslationCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Admin endpoint to create or update a translation."""
    db_t = db.query(models.Translation).filter(models.Translation.key == translation.key).first()
    if db_t:
        db_t.en = translation.en
        db_t.ar = translation.ar
        db_t.ru = translation.ru
    else:
        db_t = models.Translation(**translation.dict())
        db.add(db_t)
    db.commit()
    db.refresh(db_t)
    return db_t


@app.delete("/api/admin/translations/{translation_id}")
def delete_translation(
    translation_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(get_admin_user)
):
    """Admin endpoint to delete a translation."""
    db_t = db.query(models.Translation).filter(models.Translation.id == translation_id).first()
    if not db_t:
        raise HTTPException(status_code=404, detail="Translation not found")
    db.delete(db_t)
    db.commit()
    return {"success": True}


# --- Admin WhatsApp Data Access ---

@app.get("/api/admin/whatsapp/users/{user_id}/profile")
def admin_get_whatsapp_profile(
    user_id: uuid.UUID,
    admin: models.User = Depends(get_admin_user),
):
    """Admin only: Fetch WhatsApp profile info for a specific user."""
    result = ws.get_profile(str(user_id))
    if not result.get("success", False):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to fetch profile"))
    return result

@app.get("/api/admin/whatsapp/users/{user_id}/chats")
def admin_get_whatsapp_chats(
    user_id: uuid.UUID,
    limit: int = Query(50),
    page: int = Query(0),
    admin: models.User = Depends(get_admin_user),
):
    """Admin only: Fetch WhatsApp chats for a specific user."""
    result = ws.get_chats(str(user_id), limit, page)
    return result

@app.get("/api/admin/whatsapp/users/{user_id}/contacts")
def admin_get_whatsapp_contacts(
    user_id: uuid.UUID,
    query: str = Query(""),
    admin: models.User = Depends(get_admin_user),
):
    """Admin only: Fetch WhatsApp contacts for a specific user."""
    result = ws.get_contacts(str(user_id), query)
    return result

@app.post("/api/admin/whatsapp/users/{user_id}/sync")
def admin_sync_whatsapp(
    user_id: uuid.UUID,
    admin: models.User = Depends(get_admin_user),
):
    """Admin only: Trigger background sync for a specific user."""
    result = ws.start_sync(str(user_id))
    if not result.get("success", False):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to start sync"))
    return result

@app.get("/api/admin/whatsapp/users/{user_id}/messages")
def admin_get_whatsapp_messages(
    user_id: uuid.UUID,
    chat_jid: str = Query(...),
    limit: int = Query(50),
    page: int = Query(0),
    admin: models.User = Depends(get_admin_user),
):
    """Admin only: Fetch WhatsApp messages for a specific user in a specific chat."""
    result = ws.get_messages(str(user_id), chat_jid, limit, page)
    return result


# --- Admin SMTP Settings ---

@app.get("/admin/smtp", response_model=schemas.SmtpSettings)
def admin_get_smtp(
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db),
):
    """Get current SMTP settings (password masked)."""
    settings = _get_smtp_settings(db)
    return schemas.SmtpSettings(
        smtp_host=settings.get("smtp_host", ""),
        smtp_port=int(settings.get("smtp_port") or 587),
        smtp_user=settings.get("smtp_user", ""),
        smtp_password="••••••••" if settings.get("smtp_password") else "",
        from_email=settings.get("from_email", ""),
    )


@app.post("/admin/smtp", response_model=schemas.SmtpSettings)
def admin_update_smtp(
    payload: schemas.SmtpSettings,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(database.get_db),
):
    """Save SMTP settings. Password is saved only if changed (not masked value)."""
    data = {
        "smtp_host": payload.smtp_host,
        "smtp_port": str(payload.smtp_port),
        "smtp_user": payload.smtp_user,
        "from_email": payload.from_email,
    }
    # Only update password if user didn't submit the masked value
    if payload.smtp_password and payload.smtp_password != "••••••••":
        data["smtp_password"] = payload.smtp_password

    for key, value in data.items():
        row = db.query(models.SystemSettings).filter(models.SystemSettings.key == key).first()
        if row:
            row.value = value
        else:
            db.add(models.SystemSettings(key=key, value=value))
    db.commit()
    return admin_get_smtp(admin=admin, db=db)


@app.post("/admin/smtp/test")
def admin_test_smtp(
    payload: schemas.SmtpSettings,
    admin: models.User = Depends(get_admin_user),
):
    """Test SMTP connection by sending a test email to admin."""
    success = email_service.send_fail_notification(
        smtp_host=payload.smtp_host,
        smtp_port=payload.smtp_port,
        smtp_user=payload.smtp_user,
        smtp_password=payload.smtp_password,
        from_email=payload.from_email or payload.smtp_user,
        to_email=admin.email,
        phone="9647700000000",
        error="هذه رسالة اختبار — Test message",
    )
    if success:
        return {"success": True, "message": f"تم إرسال رسالة اختبار إلى {admin.email}"}
    raise HTTPException(status_code=502, detail="فشل إرسال رسالة الاختبار — تحقق من إعدادات SMTP")


@app.get("/")
def root():
    return {"status": "online", "platform": "WhatsApp OTP SaaS"}
