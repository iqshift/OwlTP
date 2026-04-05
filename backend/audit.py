import asyncio
import json
import models
from sqlalchemy.orm import Session
from fastapi import Request
from typing import Optional, Any
import logging
import alerts # 🛰️ Phase 8 Hook

logger = logging.getLogger("owltp_audit")

def log_action(
    db: Session,
    action: str,
    user_id: Optional[Any] = None,
    request: Optional[Request] = None,
    metadata: Optional[dict] = None
):
    """
    Records a sensitive action in the audit_logs table and logs to stdout.
    """
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    # 🛰️ Phase 8: Active Defense Radar (Async Trigger)
    if action.endswith("_FAIL") and ip_address:
        # Use asyncio background task to avoid blocking the request
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(alerts.check_threat_patterns(ip_address, action, str(user_id) if user_id else "Anon"))
        except Exception as e:
            logger.error(f"THREAT_CHECK_TRIGGER_FAIL: {e}")

    audit_entry = models.AuditLog(
        user_id=user_id,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata_json=json.dumps(metadata) if metadata else None
    )
    
    try:
        db.add(audit_entry)
        db.commit()
        
        # Also log to structured output
        log_msg = {
            "event": "audit",
            "action": action,
            "user_id": str(user_id) if user_id else "system",
            "ip": ip_address,
            "metadata": metadata
        }
        logger.info(json.dumps(log_msg))
        
    except Exception as e:
        db.rollback()
        logger.error(f"FATAL: Failed to write audit log: {e}")
