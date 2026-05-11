# Golden Fortune — Version prête pour Render

## Changements importants

- Backend Django prêt pour Render : Gunicorn, WhiteNoise, PostgreSQL via `DATABASE_URL`.
- `DEBUG=0` par défaut.
- Pas de SQLite en production.
- Les clés sensibles FedaPay restent uniquement dans les variables d’environnement Render côté backend.
- La clé publique FedaPay du frontend passe par `VITE_FEDAPAY_PUBLIC_KEY`.
- CORS configuré par variable d’environnement.
- Les routes admin restent protégées par JWT + `IsAdminUser` côté backend. Le frontend ne décide jamais des droits.
- Les tâches sont disponibles seulement entre 8h et 11h.
- Une tâche est faisable tous les 2 jours.
- Gain tâche décidé uniquement par le backend : 80 XOF ou 100 XOF.

## Déploiement backend Render

Créer une base PostgreSQL Render, puis créer un Web Service :

- Root Directory : `backend`
- Build Command :

```bash
./build.sh
```

- Start Command :

```bash
gunicorn config.wsgi:application
```

Variables Render backend :

```env
DEBUG=0
SECRET_KEY=une-longue-cle-secrete
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=TON-BACKEND.onrender.com,.onrender.com
CORS_ALLOWED_ORIGINS=https://TON-FRONTEND.onrender.com
CSRF_TRUSTED_ORIGINS=https://TON-BACKEND.onrender.com,https://TON-FRONTEND.onrender.com
FEDAPAY_ENV=sandbox
FEDAPAY_SECRET_KEY=sk_xxx
FEDAPAY_WEBHOOK_SECRET=xxx
ACTIVATION_AMOUNT=3500
```

Créer l’admin après déploiement :

```bash
python manage.py createsuperuser
```

## Déploiement frontend Render

Créer un Static Site :

- Root Directory : `frontend`
- Build Command :

```bash
npm install && npm run build
```

- Publish Directory :

```bash
dist
```

Variables Render frontend :

```env
VITE_API_BASE_URL=https://TON-BACKEND.onrender.com/api
VITE_FEDAPAY_PUBLIC_KEY=pk_sandbox_ou_live_xxx
```

## Lancement local

Backend :

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py createsuperuser
python3 manage.py runserver
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```
