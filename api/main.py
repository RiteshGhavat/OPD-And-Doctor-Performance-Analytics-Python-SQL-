from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth_routes, register_routes
from models import models  
from routes.admin import dashboard
from routes.admin import doctor
from routes.admin import branch_router
from routes.admin import users
from routes.admin.analytics import overview
from routes.admin.analytics import doctor_analytics
from routes.admin.analytics import revenue
from routes.admin.analytics import peak_hours
from routes.users import userdashboard

app = FastAPI(title="Hospital Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)

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