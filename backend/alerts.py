import httpx
import logging
import json
from datetime import datetime
from typing import Optional, Any, Dict
from config import settings
from redis_client import get_redis

logger = logging.getLogger("owltp_alerts")

async def send_telegram_alert(event_type: str, metadata: dict):
    """
    Ships a 'Threat Card' to the admin's Telegram Bot.
    """
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_ADMIN_CHAT_ID:
        logger.warning(f"ALERT_SKIPPED: Telegram credentials missing. Event: {event_type}")
        return

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ip = metadata.get("ip", "Unknown")
    user_id = metadata.get("user_id", "Anonymous")
    reason = metadata.get("message", "Suspicious activity detected.")

    message = (
        f"🛰️ *Security Radar: {event_type}*\n"
        f"━━━━━━━━━━━━━━━\n"
        f"🚨 *Severity:* `CRITICAL`\n"
        f"🌐 *IP Address:* `{ip}`\n"
        f"👤 *Identity:* `{user_id}`\n"
        f"🕒 *Detected:* {timestamp}\n"
        f"📝 *Reason:* {reason}\n"
        f"━━━━━━━━━━━━━━━\n"
        f"🛡️ *Action:* `IP_AUTO_BANNED` (30m)\n"
        f"🔥 [Manage Fortress](https://owltp.com/admin/security)"
    )

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, data=payload)
            if resp.status_code != 200:
                logger.error(f"TELEGRAM_ERROR: {resp.text}")
    except Exception as e:
        logger.error(f"ALERT_DELIVERY_FAILED: {e}")

async def check_threat_patterns(ip: str, action: str, user_id: Optional[str] = None):
    """
    Rule Engine: Tracks failed actions per IP in Redis.
    If threshold is reached, triggers Alert and Ban.
    """
    if action not in ["AUTH_LOGIN_FAIL", "PASSWORD_CHANGE_FAIL", "API_AUTH_FAIL"]:
        return

    r = get_redis()
    key = f"threat_count:{ip}:{action}"
    ban_key = f"banned_ip:{ip}"

    # 1. Increment counter for this IP/Action window (60s)
    current_count = r.incr(key)
    if current_count == 1:
        r.expire(key, 60) # Window of 1 minute

    # 2. Check if already banned (throttle alerts)
    if r.exists(ban_key):
        return

    # 3. Threshold Check
    if current_count >= settings.THREAT_THRESHOLD:
        logger.warning(f"THREAT_DETECTED: IP {ip} exceeded threshold. Banning...")
        
        # ACTIVATE DEFENSE: Set ban key (30 min)
        r.setex(ban_key, settings.BAN_DURATION_SECONDS, "manual_ban_trigger")
        
        # SHIP ALERT
        await send_telegram_alert("BRUTE_FORCE_DETECTED", {
            "ip": ip,
            "user_id": user_id or "Unknown",
            "message": f"Multiple failed {action} attempts ({current_count}/min). Automated ban engaged."
        })
