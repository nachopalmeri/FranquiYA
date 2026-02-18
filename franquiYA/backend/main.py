from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db
from routers import (
    auth_router,
    stock_router,
    invoices_router,
    weather_router,
    audit_router,
    dashboard_router
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Grido Smart Ops API",
    description="Sistema de gestión integral para franquicias Grido",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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

@app.get("/")
def read_root():
    return {
        "status": "Sistema Operativo",
        "franchise": "Grido Lanús",
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
