# Contributing

Thanks for contributing to this Django + React project!

## Prerequisites

- Python 3.12+, Node.js 20+, npm, and Git
- SQLite is used by default for local development

## Local Setup

```bash
git clone https://github.com/YOUR_USERNAME/django-react-autopilot-test.git
cd django-react-autopilot-test
cd backend && pip install -r requirements.txt
python3 manage.py migrate && python3 manage.py seed_demo_data
cd ../frontend && npm install
```

## Running the Application

```bash
# Terminal 1 — Django backend
cd backend && python3 manage.py runserver 0.0.0.0:8000
# Terminal 2 — React frontend
cd frontend && npm run dev
```

Open http://localhost:3000 (login: **admin / admin12345**). API docs: http://localhost:8000/api/docs/

## Making Contributions

1. Create a branch from `main`: `git checkout -b feature/your-change`
2. Make changes and commit with a clear message
3. Run tests: `cd backend && python3 manage.py test inventory.tests`
4. Push your branch and open a pull request against `main`

We appreciate every contribution — thank you!
