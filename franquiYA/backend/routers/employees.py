from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.employee import Employee as EmployeeModel
from models.holiday import Holiday
from schemas import Employee, EmployeeCreate, EmployeeUpdate, EmployeeWithRole
from auth import get_current_active_user, check_permission
from typing import List

router = APIRouter(prefix="/employees", tags=["employees"])

@router.get("", response_model=list[EmployeeWithRole])
def get_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("employees:view"))
):
    employees = db.query(EmployeeModel).filter(
        EmployeeModel.franchise_id == current_user.franchise_id,
        EmployeeModel.is_active == True
    ).all()
    
    result = []
    for emp in employees:
        emp_dict = EmployeeWithRole.model_validate(emp)
        holidays = db.query(Holiday).filter(
            Holiday.employee_id == emp.id,
            Holiday.status.in_(["approved", "taken"])
        ).all()
        total_taken = sum(h.days_count for h in holidays)
        emp_dict.vacation_taken = total_taken
        emp_dict.vacation_remaining = emp.vacation_days_total - total_taken
        result.append(emp_dict)
    
    return result

@router.get("/{employee_id}", response_model=EmployeeWithRole)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    emp = db.query(EmployeeModel).filter(
        EmployeeModel.id == employee_id,
        EmployeeModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    emp_dict = EmployeeWithRole.model_validate(emp)
    holidays = db.query(Holiday).filter(
        Holiday.employee_id == emp.id,
        Holiday.status.in_(["approved", "taken"])
    ).all()
    total_taken = sum(h.days_count for h in holidays)
    emp_dict.vacation_taken = total_taken
    emp_dict.vacation_remaining = emp.vacation_days_total - total_taken
    
    return emp_dict

@router.post("", response_model=Employee)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("employees:manage"))
):
    db_employee = EmployeeModel(
        name=employee.name,
        role_id=employee.role_id,
        phone=employee.phone,
        dni=employee.dni,
        emergency_contact=employee.emergency_contact,
        vacation_days_total=employee.vacation_days_total,
        hourly_rate=employee.hourly_rate,
        user_id=employee.user_id,
        franchise_id=current_user.franchise_id
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.put("/{employee_id}", response_model=Employee)
def update_employee(
    employee_id: int,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_employee = db.query(EmployeeModel).filter(
        EmployeeModel.id == employee_id,
        EmployeeModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    if employee.name is not None:
        db_employee.name = employee.name
    if employee.role_id is not None:
        db_employee.role_id = employee.role_id
    if employee.phone is not None:
        db_employee.phone = employee.phone
    if employee.dni is not None:
        db_employee.dni = employee.dni
    if employee.emergency_contact is not None:
        db_employee.emergency_contact = employee.emergency_contact
    if employee.vacation_days_total is not None:
        db_employee.vacation_days_total = employee.vacation_days_total
    if employee.hourly_rate is not None:
        db_employee.hourly_rate = employee.hourly_rate
    if employee.is_active is not None:
        db_employee.is_active = employee.is_active
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("employees:manage"))
):
    db_employee = db.query(EmployeeModel).filter(
        EmployeeModel.id == employee_id,
        EmployeeModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    db_employee.is_active = False
    db.commit()
    
    return {"message": "Empleado eliminado"}

@router.get("/{employee_id}/vacation-summary")
def get_vacation_summary(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    emp = db.query(EmployeeModel).filter(
        EmployeeModel.id == employee_id,
        EmployeeModel.franchise_id == current_user.franchise_id
    ).first()
    
    if not emp:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    holidays = db.query(Holiday).filter(
        Holiday.employee_id == employee_id
    ).order_by(Holiday.start_date.desc()).all()
    
    total_taken = sum(h.days_count for h in holidays if h.status in ["approved", "taken"])
    planned = [h for h in holidays if h.status == "planned"]
    
    return {
        "employee_id": employee_id,
        "employee_name": emp.name,
        "total_days": emp.vacation_days_total,
        "days_taken": total_taken,
        "days_remaining": emp.vacation_days_total - total_taken,
        "planned_holidays": [
            {
                "id": h.id,
                "start_date": h.start_date,
                "end_date": h.end_date,
                "days_count": h.days_count,
                "status": h.status
            }
            for h in planned
        ]
    }
