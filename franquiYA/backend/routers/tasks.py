from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.task import Task
from models.employee import Employee
from schemas import Task, TaskCreate, TaskUpdate, TaskWithDetails
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=list[TaskWithDetails])
def get_tasks(
    status: str = None,
    priority: str = None,
    assigned_to: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Task).filter(
        Task.franchise_id == current_user.franchise_id
    )
    
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)
    
    tasks = query.order_by(Task.created_at.desc()).all()
    
    result = []
    for t in tasks:
        t_dict = TaskWithDetails.model_validate(t)
        t_dict.creator = {"id": current_user.id, "name": current_user.name}
        if t.assigned_to:
            emp = db.query(Employee).filter(Employee.id == t.assigned_to).first()
            if emp:
                t_dict.assignee = {"id": emp.id, "name": emp.name}
        result.append(t_dict)
    
    return result

@router.post("", response_model=Task)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify employee if assigned
    if task.assigned_to:
        employee = db.query(Employee).filter(
            Employee.id == task.assigned_to,
            Employee.franchise_id == current_user.franchise_id
        ).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    db_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        assigned_to=task.assigned_to,
        created_by=current_user.id,
        franchise_id=current_user.franchise_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/{task_id}", response_model=Task)
def update_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = db.query(Task).filter(
        Task.id == task_id,
        Task.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    if task.title is not None:
        db_task.title = task.title
    if task.description is not None:
        db_task.description = task.description
    if task.priority is not None:
        db_task.priority = task.priority
    if task.status is not None:
        db_task.status = task.status
        if task.status == "completed":
            db_task.completed_at = datetime.utcnow()
    if task.assigned_to is not None:
        db_task.assigned_to = task.assigned_to
    if task.due_date is not None:
        db_task.due_date = task.due_date
    
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = db.query(Task).filter(
        Task.id == task_id,
        Task.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    db.delete(db_task)
    db.commit()
    
    return {"message": "Tarea eliminada"}

@router.get("/stats")
def get_task_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get task statistics"""
    tasks = db.query(Task).filter(
        Task.franchise_id == current_user.franchise_id
    ).all()
    
    return {
        "total": len(tasks),
        "pending": len([t for t in tasks if t.status == "pending"]),
        "in_progress": len([t for t in tasks if t.status == "in_progress"]),
        "completed": len([t for t in tasks if t.status == "completed"]),
        "urgent": len([t for t in tasks if t.priority == "urgent" and t.status != "completed"])
    }
