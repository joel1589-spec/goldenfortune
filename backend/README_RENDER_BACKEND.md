# Backend Render

Build command:

```bash
./build.sh
```

Start command:

```bash
gunicorn config.wsgi:application
```

Required env vars:

```env
DEBUG=0
SECRET_KEY=change-me
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=TON-BACKEND.onrender.com,.onrender.com
CORS_ALLOWED_ORIGINS=https://TON-FRONTEND.onrender.com
CSRF_TRUSTED_ORIGINS=https://TON-BACKEND.onrender.com,https://TON-FRONTEND.onrender.com
FEDAPAY_SECRET_KEY=sk_xxx
FEDAPAY_WEBHOOK_SECRET=xxx
```
