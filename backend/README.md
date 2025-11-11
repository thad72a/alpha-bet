Backend (FastAPI) for Bittensor Subnet Data
===========================================

Run locally
-----------
1) Create and activate a virtual environment (optional but recommended)
   python3 -m venv .venv && source .venv/bin/activate

2) Install dependencies
   pip install -r requirements.txt

3) Start the server
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Environment
-----------
Copy .env.example to .env if needed. Defaults should work for local development.

API routes
----------
- GET /health
- GET /subnets
- GET /subnets/{netuid}/metagraph

Notes
-----
- This service uses the official `bittensor` Python package to read mainnet data.
- CORS is enabled for localhost:3000 by default; adjust in app/main.py as needed.


