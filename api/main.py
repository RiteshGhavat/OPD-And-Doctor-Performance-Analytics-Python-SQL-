import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from models import models  # registers all ORM models

from routes import auth_routes, register_routes
from routes.admin import dashboard, doctor, branch_router, users
from routes.admin.analytics import overview, doctor_analytics, revenue, peak_hours
from routes.users import userdashboard

app = FastAPI(
    title="Doctor Performance Analytics API",
    version="1.0.0"
)

# ── CORS ─────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
allowed_origins = [u.strip() for u in FRONTEND_URL.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── CREATE DB TABLES ─────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── ROUTES ───────────────────────────────────────────────────────────────────
app.include_router(register_routes.router)
app.include_router(auth_routes.router)
app.include_router(dashboard.router)
app.include_router(doctor.router)
app.include_router(branch_router.router)
app.include_router(users.router)
app.include_router(overview.router)
app.include_router(doctor_analytics.router)
app.include_router(revenue.router)
app.include_router(peak_hours.router)
app.include_router(userdashboard.router)


# ── HEALTH CHECK ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Doctor Performance Analytics API is running ✅"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}