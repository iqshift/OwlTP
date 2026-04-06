import random
import time
import json
import threading
import redis
import os
import re
from datetime import datetime, timezone, timedelta

from celery import Celery
from celery.signals import worker_ready

import whatsapp_service
import database, models


# For production, use environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
REDIS_CLIENT = redis.from_url(REDIS_URL)

celery_app = Celery(
    "whatsapp_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

ws = whatsapp_service.WhatsAppService()

# Varied prompts for Interaction Strategy to avoid repetition
SMART_INTERACTION_PROMPTS = [
    "Hello, did you request an OwlTP verification code? Reply with (Yes) to receive it.",
    "Welcome! Can we send your activation code now? Reply (Yes) to confirm.",
    "OwlTP: We need to verify your identity before sending the code. Did you request it? (Yes/No)",
    "New code requested? Please reply with (Yes) to receive it immediately.",
    "Hi, to secure your account, did you request an OTP? Reply with (Yes)."
]


def normalize_arabic(text: str) -> str:
    """Normalizes Arabic text for robust keyword matching."""
    if not text: return ""
    text = text.strip().lower()
    # Replace common variations
    replacements = {
        'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
        'ة': 'ه', 'ى': 'ي',
        'ؤ': 'و', 'ئ': 'ي',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def is_confirmation(text: str) -> bool:
    """Checks if the message is a confirmation (Yes/Done)."""
    norm = normalize_arabic(text)
    keywords = ["نعم", "تم", "موافق", "انطيك", "ارسل", "yes", "ok", "done", "confirm"]
    return any(k in norm for k in keywords)


def process_active_interactions():
    """Persistent Redis listener for incoming WhatsApp events."""
    pubsub = REDIS_CLIENT.pubsub()
    pubsub.psubscribe("whatsapp:events:*")
    
    print("🚀 Interaction Event Listener started. Listening for WhatsApp events...")
    
    for message in pubsub.listen():
        if message["type"] == "pmessage":
            try:
                channel = message["channel"].decode("utf-8")
                user_id = channel.split(":")[2]
                data = json.loads(message["data"])
                
                if data["type"] == "message":
                    handle_interaction_response(user_id, data["data"])
            except Exception as e:
                print(f"ERROR: Failed to process interaction event: {e}")


def handle_interaction_response(user_id: str, msg_data: dict):
    """Handles a single incoming message from Redis."""
    if msg_data.get("is_from_me"):
        return

    phone = msg_data.get("phone", "").split("@")[0] # Clean JID
    content = msg_data.get("message", "")
    
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user: return

        # Check for confirmation using user-defined keywords
        keywords = [k.strip().lower() for k in user.interaction_keywords.split(",")]
        normalized_content = normalize_arabic(content)
        if not any(k in normalized_content for k in keywords):
            return

        # Find active OTP requests for this phone
        now = datetime.now(timezone.utc)
        req = db.query(models.OTPRequest).filter(
            models.OTPRequest.user_id == user_id,
            models.OTPRequest.phone == phone,
            models.OTPRequest.status == "pending",
            models.OTPRequest.expires_at > now
        ).first()

        if req:
            print(f"✅ Interaction: User {phone} confirmed. Sending OTP {req.code}")
            
            # 1. Build final message
            final_msg = req.template
            if "{code}" not in final_msg:
                final_msg += f" {req.code}"
            else:
                final_msg = final_msg.replace("{code}", req.code)

            safe_name = req.name if req.name else "User"
            final_msg = final_msg.replace("{name}", safe_name)

            # 2. Send actual OTP
            settings = {
                "account_protection": user.account_protection,
                "spintax_enabled": user.spintax_enabled,
                "name": req.name
            }
            result = ws.send_message_advanced(user_id, phone, final_msg, settings)

            # 3. Update OTPRequest
            req.status = "confirmed"
            db.commit()

            # 4. Find and update the original message record for accurate logs
            if req.message_id:
                msg_record = db.query(models.Message).filter(models.Message.id == req.message_id).first()
                if msg_record:
                    msg_record.status = "sent" if result.get("success") else "failed"
                    if not result.get("success"):
                        msg_record.error = result.get("error")
                    
                    # Update log with the actual rendered message
                    msg_record.message = final_msg
                    db.add(msg_record)
                    db.commit()

            return result
                
    finally:
        db.close()


@worker_ready.connect
def on_worker_ready(**kwargs):
    """Launch the event listener thread when Celery worker starts."""
    thread = threading.Thread(target=process_active_interactions, daemon=True)
    thread.start()


@celery_app.task(name="send_otp_message")
def send_otp_message(user_id: str, phone: str, message: str, code: str = None, name: str = None, message_id: str = None):
    """
    Background send job. Applies Anti-Ban settings from user profile.
    """
    # 🧼 CLEAN: Remove any non-numeric characters or whitespace from phone
    phone = re.sub(r"\D", "", phone)
    
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            # Update msg record to failed if user not found
            msg_record = db.query(models.Message).filter(models.Message.id == message_id).first()
            if msg_record:
                msg_record.status = "failed"
                msg_record.error = "User not found"
                db.commit()
            return {"success": False, "error": "User not found"}

        # 🔍 PRE-SEND CHECK: Is this number actually on WhatsApp?
        print(f"DEBUG: Performing pre-send verification for {phone}")
        check_res = ws.check_number(user_id, phone)
        if not check_res.get("exists"):
            msg_record = db.query(models.Message).filter(models.Message.id == message_id).first()
            if msg_record:
                msg_record.status = "failed"
                msg_record.error = "Phone number is not registered on WhatsApp"
                db.commit()
            return {"success": False, "error": "Phone number not on WhatsApp"}

        settings = {
            "interaction_strategy": user.interaction_strategy,
            "sleep_cycles": user.sleep_cycles,
            "spintax_enabled": user.spintax_enabled,
            "smart_rotation": user.smart_rotation,
        }

        # Add human-like variation if enabled (using invisible characters for uniqueness)
        if settings.get("account_protection") == "true":
            # Use invisible random variations instead of visible timestamps
            invis_chars = ["\u200B", "\u200C", "\u200D", "\uFEFF"]
            message += random.choice(invis_chars) * random.randint(1, 3)

        # Handle Smart Rotation Logic (Picks strategy for the user)
        if settings.get("smart_rotation") == "true":
            # Get current index from Redis
            redis_key = f"rotation_idx:{user_id}"
            idx = int(REDIS_CLIENT.incr(redis_key))
            strategy_v = idx % 3
            
            if strategy_v == 0:
                settings["interaction_strategy"] = "true"
                settings["account_protection"] = "true"
            elif strategy_v == 1:
                settings["interaction_strategy"] = "false"
                settings["account_protection"] = "true"
                settings["spintax_enabled"] = "true"
            else:
                settings["interaction_strategy"] = "false"
                settings["account_protection"] = "true"
                settings["spintax_enabled"] = "false"

        # Handle Interaction Strategy (2-step OTP)
        if settings.get("interaction_strategy") == "true" and code:
            # 1. Start the listen daemon
            ws.start_listen_daemon(user_id, REDIS_URL)

            # 2. Create a pending OTP request
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
            safe_name = name if name else "User"
            otp_req = models.OTPRequest(
                user_id=user.id,
                phone=phone,
                code=code,
                template=user.otp_template or "Your verification code is: {code}",
                status="pending",
                expires_at=expires_at,
                message_id=message_id,
                name=safe_name
            )
            db.add(otp_req)
            db.commit()

            # 3. Send the custom Interaction Question
            prompt = user.interaction_question.replace("{name}", safe_name)
            result = ws.send_message_advanced(user_id, phone, prompt, settings)
            
            # 🔑 CRITICAL: Update main message record if question fails
            if message_id:
                msg_record = db.query(models.Message).filter(models.Message.id == message_id).first()
                if msg_record:
                    if not result.get("success"):
                        msg_record.status = "failed"
                        msg_record.error = result.get("error")
                        msg_record.message = prompt
                        db.commit()
                    else:
                        # Success here means question was sent. We keep it as "sent" (optimistic)
                        # but we update the message body to show what was actually sent
                        msg_record.message = prompt
                        db.commit()
            return result

        # Handle Normal Direct Send
        safe_name = name if name else "User"
        final_msg = user.otp_template or "Your verification code is: {code}"
        
        # Apply Spintax if enabled
        if settings.get("spintax_enabled") == "true" and code:
            options = [user.spintax_1, user.spintax_2, user.spintax_3]
            final_msg = random.choice(options)

        # Inject code and name
        if "{code}" in final_msg:
            final_msg = final_msg.replace("{code}", str(code))
        else:
            final_msg = f"{final_msg} {code}"
        
        final_msg = final_msg.replace("{name}", safe_name)

        result = ws.send_message_advanced(user_id, phone, final_msg, settings)
        
        # 9. Update Message status in DB
        if message_id:
            msg_record = db.query(models.Message).filter(models.Message.id == message_id).first()
            if msg_record:
                msg_record.status = "sent" if result.get("success") else "failed"
                if not result.get("success"):
                    msg_record.error = result.get("error")
                # Update log with the actual rendered message
                msg_record.message = final_msg
                db.commit()

        return result
    finally:
        db.close()


@celery_app.task(name="sync_session_job")
def sync_session_job(user_id: str):
    """
    Background job to sync WhatsApp session and update DB with connection status.
    This can be scheduled periodically via Celery beat / external scheduler.
    """
    result = ws.sync_session(user_id)

    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return result

        session = (
            db.query(models.WhatsAppSession)
            .filter(models.WhatsAppSession.user_id == user_id)
            .first()
        )
        if not session:
            return result

        status_str = result.get("status") or session.status
        session.status = status_str
        session.last_sync_at = datetime.now(timezone.utc)
        session.last_status_check_at = datetime.now(timezone.utc)
        session.device_id = result.get("device_id") or session.device_id

        if not result.get("success"):
            session.last_error = result.get("error")
        else:
            session.last_error = None

        db.add(session)
        db.commit()

        # Handle Interaction Strategy: Check for 'Yes' replies in messages
        if user.interaction_strategy == "true":
            # Search for pending requests for this user
            pending_requests = db.query(models.OTPRequest).filter(
                models.OTPRequest.user_id == user_id,
                models.OTPRequest.status == "pending",
                models.OTPRequest.expires_at > datetime.now(timezone.utc)
            ).all()

            if pending_requests:
                # Fetch recent messages received from WhatsApp
                for req in pending_requests:
                    # phone search in CLI messages
                    # This is tricky as we need to query CLI sqlite or look at sync logs.
                    # For simplicity, we'll use a mocked check or assume the next sync sees it.
                    # Real implementation: call ws.get_messages(user_id, req.phone)
                    recent_msgs = ws.get_messages(user_id, req.phone, limit=5)
                    if recent_msgs.get("success") and "items" in recent_msgs:
                        for msg in recent_msgs["items"]:
                            # If message is from contact and is 'Yes'
                            if msg.get("status") != "me" and any(k in str(msg.get("message")).lower() for k in ["نعم", "yes", "ok", "تم"]):
                                # 1. Mark as confirmed
                                req.status = "confirmed"
                                db.add(req)
                                db.commit()

                                # 2. Send the actual OTP
                                final_msg = req.template.replace("{code}", req.code)
                                settings = {
                                    "account_protection": user.account_protection,
                                    "spintax_enabled": user.spintax_enabled
                                }
                                ws.send_message_advanced(user_id, req.phone, final_msg, settings)
                                print(f"DEBUG Interaction: Sent OTP to {req.phone} after confirmation.")
                                break

    finally:
        db.close()

    return result
