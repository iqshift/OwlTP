from datetime import datetime, timezone
import os

from celery import Celery

import whatsapp_service
import database, models


# For production, use environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "whatsapp_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

ws = whatsapp_service.WhatsAppService()


@celery_app.task(name="send_otp_message")
def send_otp_message(user_id: str, phone: str, message: str):
    """
    Background send job. Can be wired from the API if you want fully async sends.
    """
    return ws.send_message(user_id, phone, message)


@celery_app.task(name="sync_session_job")
def sync_session_job(user_id: str):
    """
    Background job to sync WhatsApp session and update DB with connection status.
    This can be scheduled periodically via Celery beat / external scheduler.
    """
    result = ws.sync_session(user_id)

    db = database.SessionLocal()
    try:
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
    finally:
        db.close()

    return result
