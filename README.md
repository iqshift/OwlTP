# WhatsApp OTP API Platform (SaaS)

منصة احترافية لإرسال رسائل الـ OTP عبر واتساب باستخدام `whatsapp-cli`.

## المميزات
- **نظام SaaS متكامل**: دعم تعدد المستخدمين وفصل الجلسات.
- **FastAPI Backend**: أداء عالٍ وموثوقية.
- **Next.js 14 Frontend**: واجهة مستخدم عصرية وسريعة.
- **Dockerized**: سهولة النشر باستخدام Docker Compose.
- **Rate Limiting**: حماية الـ API من الاستخدام المفرط.

## المتطلبات
- Docker & Docker Compose
- WhatsApp Account

## طريقة التشغيل
1. قم بتحميل المشروع.
2. ضع باينري `whatsapp-cli` في مجلد `backend` أو تأكد من تثبيته في الـ Dockerfile.
3. قم بتشغيل الأمر:
   ```bash
   docker-compose up --build
   ```
4. افتح `http://localhost:3000` في متصفحك.

## هيكل المجلدات
- `backend/`: كود الواجهة الخلفية (FastAPI).
- `frontend/`: كود الواجهة الأمامية (Next.js).
- `docker/`: ملفات Docker للخدمات.
- `sessions/`: مجلد تخزين جلسات واتساب المعزولة.

## ملاحظات الأمان
- يتم تخزين كلمات المرور مشفرة باستخدام `Bcrypt`.
- يتم استخدام `JWT` للمصادقة.
- تأكد من تغيير `JWT_SECRET` في ملف الإعدادات قبل النشر.
