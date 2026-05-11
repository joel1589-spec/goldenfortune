#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
rm -f db.sqlite3
python3 manage.py makemigrations accounts finance tasks
python3 manage.py migrate
python3 manage.py seed || true
echo "OK: base de données réinitialisée. Crée maintenant le superuser: python3 manage.py createsuperuser"
