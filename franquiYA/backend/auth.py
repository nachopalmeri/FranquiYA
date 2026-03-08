from datetime import datetime, timedelta
from typing import Optional, List, Any
from functools import wraps
from jose import JWTError, jwt
import bcrypt
import os
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models.user import User

SECRET_KEY = os.getenv("JWT_SECRET", "grido-smart-ops-secret-key-2026-dev-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

PERMISSIONS = {
    "dashboard:view": "Ver dashboard",
    "stock:manage": "Gestionar stock",
    "stock:audit": "Realizar auditorías",
    "invoices:upload": "Subir facturas",
    "invoices:approve": "Aprobar líneas de factura",
    "employees:manage": "Gestionar empleados",
    "employees:view": "Ver empleados",
    "shifts:manage": "Gestionar turnos",
    "shifts:view": "Ver turnos",
    "holidays:manage": "Gestionar vacaciones",
    "holidays:approve": "Aprobar vacaciones",
    "tasks:manage": "Gestionar tareas",
    "tasks:view": "Ver tareas",
    "calendar:manage": "Gestionar calendario",
    "calendar:view": "Ver calendario",
    "franchise:settings": "Configuración de franquicia",
    "chat:use": "Usar chatbot",
}

DEFAULT_FRANQUICIADO_PERMISSIONS = [
    "dashboard:view", "stock:manage", "stock:audit",
    "invoices:upload", "invoices:approve",
    "employees:manage", "employees:view",
    "shifts:manage", "shifts:view",
    "holidays:manage", "holidays:approve",
    "tasks:manage", "tasks:view",
    "calendar:manage", "calendar:view",
    "franchise:settings", "chat:use",
]

DEFAULT_EMPLEADO_PERMISSIONS = [
    "dashboard:view", "stock:view",
    "shifts:view", "holidays:view",
    "tasks:view", "calendar:view", "chat:use",
]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_token_from_header_or_cookie(request: Request) -> str:
    """Get token from Authorization header or cookie"""
    # Try Authorization header first
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]  # Remove "Bearer " prefix
    
    # Try cookie
    token = request.cookies.get("token")
    if token:
        return token
    
    # No token found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = get_token_from_header_or_cookie(request)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


def get_current_franchise_id(current_user: User = Depends(get_current_active_user)) -> int:
    """Get the franchise_id for the current user. Returns None for superadmin (can see all)."""
    if current_user.role == "superadmin":
        return None  # Superadmin can see all franchises
    return current_user.franchise_id


def require_franchise_access():
    """Dependency that allows admin/superadmin to access all franchises, 
    but regular users can only access their own franchise data."""
    def dependency(current_user: User = Depends(get_current_active_user)):
        if current_user.role in ["admin", "superadmin"]:
            return None  # Return None to indicate access to all franchises
        return current_user.franchise_id
    return dependency


def check_permission(permission: str):
    def dependency(current_user: User = Depends(get_current_active_user)):
        if current_user.role in ["admin", "superadmin"]:
            return current_user
        
        from models.role import Role
        from models.employee import Employee
        from database import get_db
        db = next(get_db())
        
        permissions = DEFAULT_EMPLEADO_PERMISSIONS.copy()
        
        if current_user.user_type == "franquiciado":
            permissions = DEFAULT_FRANQUICIADO_PERMISSIONS.copy()
        
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()
        
        if employee and employee.role:
            role_permissions = employee.role.permissions or ""
            if role_permissions:
                role_perms = [p.strip() for p in role_permissions.split(",") if p.strip()]
                permissions.extend(role_perms)
        
        if permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}"
            )
        
        return current_user
    
    return dependency


def get_franchise_filter(model_class, franchise_id_column, current_user: User = Depends(get_current_active_user)):
    """Returns a filter condition for franchise-aware queries.
    
    Usage:
        query = db.query(Model).filter(get_franchise_filter(Model, Model.franchise_id, current_user))
    
    For superadmin, returns True (no filter - all franchises).
    For regular users, returns filter for their franchise_id.
    """
    if current_user.role == "superadmin":
        return True  # No filter - return all
    
    return franchise_id_column == current_user.franchise_id


def require_permissions(*required_permissions: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            from fastapi import Depends as FastAPIDepends
            
            user_dependency = check_permission(required_permissions[0])
            for perm in required_permissions[1:]:
                user_dependency = combine_dependencies(user_dependency, check_permission(perm))
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def combine_dependencies(dep1, dep2):
    def combined(*args, **kwargs):
        result1 = dep1(*args, **kwargs)
        result2 = dep2(*args, **kwargs)
        return result1
    return combined
