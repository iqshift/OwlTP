"""
Email notification service using SMTP.
SMTP settings are loaded from system_settings table by the caller.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger(__name__)


def send_fail_notification(
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    from_email: str,
    to_email: str,
    phone: str,
    error: Optional[str] = None,
) -> bool:
    """
    Send an email notification when OTP delivery fails.
    Returns True if sent successfully, False otherwise.
    """
    try:
        subject = "⚠️ فشل إرسال OTP — OwlTP"
        body = f"""
        <html><body style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
        <div style="max-width:500px;margin:0 auto;background:#1e293b;border-radius:12px;padding:24px;border:1px solid #334155;">
            <h2 style="color:#f87171;margin-top:0;">⚠️ فشل إرسال رسالة OTP</h2>
            <p>فشل إرسال رسالة OTP إلى الرقم:</p>
            <div style="background:#0f172a;border-radius:8px;padding:12px;font-family:monospace;font-size:16px;color:#4ade80;">
                {phone}
            </div>
            {f'<p style="color:#94a3b8;font-size:13px;">السبب: {error}</p>' if error else ''}
            <hr style="border-color:#334155;margin:20px 0;">
            <p style="color:#64748b;font-size:12px;">OwlTP — WhatsApp OTP Platform</p>
        </div>
        </body></html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        msg.attach(MIMEText(body, "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())

        logger.info(f"Fail notification sent to {to_email} for phone {phone}")
        return True

    except Exception as e:
        logger.error(f"Failed to send fail notification: {e}")
        return False
