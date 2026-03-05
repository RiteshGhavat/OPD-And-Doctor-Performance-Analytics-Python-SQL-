from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.database import engine, Base
from api.routes import auth_routes, register_routes
from api.models import models

from api.routes.admin import dashboard, doctor, branch_router, users
from api.routes.admin.analytics import overview, doctor_analytics, revenue, peak_hours
from api.routes.users import userdashboard

app = FastAPI(title="Hospital Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ❌ DO NOT RUN create_all() on Vercel
# Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "Hospital Analytics API running"}

@app.get("/health")
def health():
    return {"health": "ok"}

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