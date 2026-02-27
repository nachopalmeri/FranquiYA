from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.external_event import ExternalEvent
from schemas import ExternalEvent, ExternalEventCreate, ExternalEventUpdate
from auth import get_current_active_user

router = APIRouter(prefix="/external-events", tags=["external_events"])

@router.get("", response_model=list[ExternalEvent])
def get_external_events(
    month: str = None,  # "2024-06"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(ExternalEvent).filter(
        ExternalEvent.franchise_id == current_user.franchise_id
    )
    
    if month:
        query = query.filter(ExternalEvent.date.startswith(month))
    
    return query.order_by(ExternalEvent.date).all()

@router.post("", response_model=ExternalEvent)
def create_external_event(
    event: ExternalEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_event = ExternalEvent(
        title=event.title,
        description=event.description,
        visitor_name=event.visitor_name,
        visitor_contact=event.visitor_contact,
        date=event.date,
        time_start=event.time_start,
        time_end=event.time_end,
        is_recurring=event.is_recurring,
        franchise_id=current_user.franchise_id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.put("/{event_id}", response_model=ExternalEvent)
def update_external_event(
    event_id: int,
    event: ExternalEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_event = db.query(ExternalEvent).filter(
        ExternalEvent.id == event_id,
        ExternalEvent.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if event.title is not None:
        db_event.title = event.title
    if event.description is not None:
        db_event.description = event.description
    if event.visitor_name is not None:
        db_event.visitor_name = event.visitor_name
    if event.visitor_contact is not None:
        db_event.visitor_contact = event.visitor_contact
    if event.date is not None:
        db_event.date = event.date
    if event.time_start is not None:
        db_event.time_start = event.time_start
    if event.time_end is not None:
        db_event.time_end = event.time_end
    if event.status is not None:
        db_event.status = event.status
    if event.is_recurring is not None:
        db_event.is_recurring = event.is_recurring
    
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}")
def delete_external_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_event = db.query(ExternalEvent).filter(
        ExternalEvent.id == event_id,
        ExternalEvent.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    db.delete(db_event)
    db.commit()
    
    return {"message": "Evento eliminado"}

@router.get("/calendar")
def get_events_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get events organized by month for calendar view"""
    events = db.query(ExternalEvent).filter(
        ExternalEvent.franchise_id == current_user.franchise_id,
        ExternalEvent.status == "scheduled"
    ).all()
    
    calendar = {}
    for e in events:
        month = e.date[:7]
        if month not in calendar:
            calendar[month] = []
        calendar[month].append({
            "id": e.id,
            "title": e.title,
            "visitor_name": e.visitor_name,
            "date": e.date,
            "time_start": e.time_start,
            "time_end": e.time_end
        })
    
    return {"calendar": calendar}
