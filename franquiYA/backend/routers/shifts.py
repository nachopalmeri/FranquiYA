from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.shift import Shift as ShiftModel
from models.employee import Employee
from schemas import Shift, ShiftCreate, ShiftUpdate, ShiftWithEmployee
from auth import get_current_active_user

router = APIRouter(prefix="/shifts", tags=["shifts"])

DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

@router.get("", response_model=list[ShiftWithEmployee])
def get_shifts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    shifts = db.query(ShiftModel).filter(
        ShiftModel.franchise_id == current_user.franchise_id,
        ShiftModel.is_active == True
    ).all()
    
    result = []
    for shift in shifts:
        shift_dict = ShiftWithEmployee.model_validate(shift)
        emp = db.query(Employee).filter(Employee.id == shift.employee_id).first()
        if emp:
            from schemas import EmployeeWithRole
            emp_dict = EmployeeWithRole.model_validate(emp)
            from models.holiday import Holiday
            holidays = db.query(Holiday).filter(
                Holiday.employee_id == emp.id,
                Holiday.status.in_(["approved", "taken"])
            ).all()
            total_taken = sum(h.days_count for h in holidays)
            emp_dict.vacation_taken = total_taken
            emp_dict.vacation_remaining = emp.vacation_days_total - total_taken
            shift_dict.employee = emp_dict
        result.append(shift_dict)
    
    return result

@router.post("", response_model=Shift)
def create_shift(
    shift: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    employee = db.query(Employee).filter(
        Employee.id == shift.employee_id,
        Employee.franchise_id == current_user.franchise_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    db_shift = ShiftModel(
        employee_id=shift.employee_id,
        role_id=shift.role_id,
        day_of_week=shift.day_of_week,
        start_time=shift.start_time,
        end_time=shift.end_time,
        is_recurring=shift.is_recurring,
        franchise_id=current_user.franchise_id
    )
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

@router.put("/{shift_id}", response_model=Shift)
def update_shift(
    shift_id: int,
    shift: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_shift = db.query(ShiftModel).filter(
        ShiftModel.id == shift_id,
        ShiftModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    if shift.employee_id is not None:
        db_shift.employee_id = shift.employee_id
    if shift.role_id is not None:
        db_shift.role_id = shift.role_id
    if shift.day_of_week is not None:
        db_shift.day_of_week = shift.day_of_week
    if shift.start_time is not None:
        db_shift.start_time = shift.start_time
    if shift.end_time is not None:
        db_shift.end_time = shift.end_time
    if shift.is_active is not None:
        db_shift.is_active = shift.is_active
    
    db.commit()
    db.refresh(db_shift)
    return db_shift

@router.delete("/{shift_id}")
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_shift = db.query(ShiftModel).filter(
        ShiftModel.id == shift_id,
        ShiftModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    db_shift.is_active = False
    db.commit()
    
    return {"message": "Turno eliminado"}

@router.get("/calendar")
def get_shifts_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    shifts = db.query(ShiftModel).filter(
        ShiftModel.franchise_id == current_user.franchise_id,
        ShiftModel.is_active == True
    ).all()
    
    calendar = {day: [] for day in range(7)}
    
    for shift in shifts:
        emp = db.query(Employee).filter(Employee.id == shift.employee_id).first()
        if emp:
            calendar[shift.day_of_week].append({
                "id": shift.id,
                "employee_id": emp.id,
                "employee_name": emp.name,
                "role_id": shift.role_id,
                "start_time": shift.start_time,
                "end_time": shift.end_time,
                "day_name": DAY_NAMES[shift.day_of_week]
            })
    
    return {
        "days": DAY_NAMES,
        "schedule": calendar
    }
