import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db

# Import all models in order to register them with SQLAlchemy
from models.user import User
from models.franchise import Franchise
from models.product import Product
from models.invoice import Invoice, InvoiceLine
from models.role import Role
from models.employee import Employee
from models.shift import Shift
from models.holiday import Holiday
from models.task import Task
from models.external_event import ExternalEvent
from models.attendance import Attendance
from models.audit import StockAudit

from routers import (
    auth_router,
    stock_router,
    invoices_router,
    weather_router,
    audit_router,
    dashboard_router,
    franchise_router,
    chat_router,
    roles_router,
    employees_router,
    shifts_router,
    holidays_router,
    tasks_router,
    external_events_router
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Grido Smart Ops API",
    description="Sistema de gestión integral para franquicias Grido",
    version="1.0.0"
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")
if origins == ["*"]:
    allow_origins = ["*"]
else:
    allow_origins = origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(stock_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(franchise_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(employees_router, prefix="/api")
app.include_router(shifts_router, prefix="/api")
app.include_router(holidays_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(external_events_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "Sistema Operativo",
        "franchise": "Grido Smart Ops",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
def startup_event():
    from seed import seed_database
    db = next(get_db())
    seed_database(db)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
