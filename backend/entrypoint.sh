#!/bin/bash
set -e
python manage.py migrate --noinput
python manage.py seed_demo_data 2>/dev/null || true
exec gunicorn --bind 0.0.0.0:8000 --workers 2 server.wsgi:application
