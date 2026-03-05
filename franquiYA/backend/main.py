import os
import time
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from database import engine, Base, get_db
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
    external_events_router,
    suppliers_router,
    products_router
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Grido Smart Ops API",
    description="Sistema de gestión integral para franquicias Grido",
    version="1.0.0"
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()
        
        self.request_counts[client_ip] = [
            req_time for req_time in self.request_counts[client_ip]
            if current_time - req_time < 60
        ]
        
        if len(self.request_counts[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
        
        self.request_counts[client_ip].append(current_time)
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


origins = os.getenv("CORS_ORIGINS", "*").split(",")
if origins == ["*"]:
    allow_origins = ["*"]
else:
    allow_origins = origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)

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
app.include_router(suppliers_router, prefix="/api")
app.include_router(products_router, prefix="/api")


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
