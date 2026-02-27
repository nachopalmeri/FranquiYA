from .auth import router as auth_router
from .stock import router as stock_router
from .invoices import router as invoices_router
from .weather import router as weather_router
from .audit import router as audit_router
from .dashboard import router as dashboard_router
from .franchise import router as franchise_router
from .chat import router as chat_router
from .roles import router as roles_router
from .employees import router as employees_router
from .shifts import router as shifts_router
from .holidays import router as holidays_router
from .tasks import router as tasks_router
from .external_events import router as external_events_router

__all__ = [
    "auth_router",
    "stock_router",
    "invoices_router",
    "weather_router",
    "audit_router",
    "dashboard_router",
    "franchise_router",
    "chat_router",
    "roles_router",
    "employees_router",
    "shifts_router",
    "holidays_router",
    "tasks_router",
    "external_events_router"
]
