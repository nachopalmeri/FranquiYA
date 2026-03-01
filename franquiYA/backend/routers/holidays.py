from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.holiday import Holiday as HolidayModel
from models.employee import Employee
from schemas import Holiday, HolidayCreate, HolidayUpdate, HolidayWithEmployee
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(prefix="/holidays", tags=["holidays"])

@router.get("", response_model=list[HolidayWithEmployee])
def get_holidays(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    holidays = db.query(HolidayModel).filter(
        HolidayModel.franchise_id == current_user.franchise_id
    ).order_by(HolidayModel.start_date.desc()).all()
    
    result = []
    for h in holidays:
        h_dict = HolidayWithEmployee.model_validate(h)
        emp = db.query(Employee).filter(Employee.id == h.employee_id).first()
        if emp:
            from schemas import EmployeeWithRole
            h_dict.employee = EmployeeWithRole.model_validate(emp)
        result.append(h_dict)
    
    return result

@router.post("", response_model=Holiday)
def create_holiday(
    holiday: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    employee = db.query(Employee).filter(
        Employee.id == holiday.employee_id,
        Employee.franchise_id == current_user.franchise_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    existing = db.query(HolidayModel).filter(
        HolidayModel.employee_id == holiday.employee_id,
        HolidayModel.status.in_(["approved", "taken"])
    ).all()
    
    total_taken = sum(h.days_count for h in existing)
    if total_taken + holiday.days_count > employee.vacation_days_total:
        raise HTTPException(
            status_code=400,
            detail=f"Días de vacaciones insuficientes. Disponibles: {employee.vacation_days_total - total_taken}"
        )
    
    db_holiday = HolidayModel(
        employee_id=holiday.employee_id,
        start_date=holiday.start_date,
        end_date=holiday.end_date,
        days_count=holiday.days_count,
        notes=holiday.notes,
        status=holiday.status,
        franchise_id=current_user.franchise_id
    )
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.put("/{holiday_id}", response_model=Holiday)
def update_holiday(
    holiday_id: int,
    holiday: HolidayUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_holiday = db.query(HolidayModel).filter(
        HolidayModel.id == holiday_id,
        HolidayModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Vacación no encontrada")
    
    if holiday.status is not None:
        db_holiday.status = holiday.status
        if holiday.status == "approved":
            db_holiday.approved_by = current_user.id
            db_holiday.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_holiday = db.query(HolidayModel).filter(
        HolidayModel.id == holiday_id,
        HolidayModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Vacación no encontrada")
    
    db.delete(db_holiday)
    db.commit()
    
    return {"message": "Vacación eliminada"}

@router.get("/calendar")
def get_holidays_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    holidays = db.query(HolidayModel).filter(
        HolidayModel.franchise_id == current_user.franchise_id,
        HolidayModel.status.in_(["planned", "approved"])
    ).all()
    
    calendar = {}
    for h in holidays:
        month = h.start_date[:7]
        if month not in calendar:
            calendar[month] = []
        
        emp = db.query(Employee).filter(Employee.id == h.employee_id).first()
        calendar[month].append({
            "id": h.id,
            "employee_id": h.employee_id,
            "employee_name": emp.name if emp else "Unknown",
            "start_date": h.start_date,
            "end_date": h.end_date,
            "days_count": h.days_count,
            "status": h.status
        })
    
    return {"calendar": calendar}
