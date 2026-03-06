from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date
from database import get_db
from models.user import User
from models.pay import Customer, CashRegister, CashMovement, Sale, SaleItem
from models.product import Product
from auth import get_current_active_user

router = APIRouter(prefix="/pay", tags=["pay"])

# ============= CUSTOMERS =============

class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: Optional[str] = None
    email: Optional[str] = None
    credit_limit: float = Field(default=0, ge=0)
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    credit_limit: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    credit_limit: float
    balance: float
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/customers", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Customer).filter(Customer.franchise_id == current_user.franchise_id)
    
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.phone.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%"))
        )
    
    return query.order_by(Customer.name).all()


@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customer = Customer(
        franchise_id=current_user.franchise_id,
        **data.model_dump()
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.franchise_id == current_user.franchise_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.franchise_id == current_user.franchise_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer


# ============= CASH REGISTER =============

class CashRegisterOpen(BaseModel):
    opening_amount: float = Field(..., ge=0)


class CashMovementCreate(BaseModel):
    type: str = Field(..., pattern="^(income|expense|withdrawal)$")
    amount: float = Field(..., gt=0)
    concept: Optional[str] = None
    payment_method: Optional[str] = "cash"


class CashRegisterResponse(BaseModel):
    id: int
    opening_amount: float
    closing_amount: Optional[float]
    expected_amount: Optional[float]
    difference: Optional[float]
    opened_at: datetime
    closed_at: Optional[datetime]
    status: str

    class Config:
        from_attributes = True


@router.get("/cash-register/status", response_model=Optional[CashRegisterResponse])
def get_cash_register_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current open cash register"""
    register = db.query(CashRegister).filter(
        CashRegister.franchise_id == current_user.franchise_id,
        CashRegister.status == "open"
    ).first()
    
    return register


@router.post("/cash-register/open", response_model=CashRegisterResponse)
def open_cash_register(
    data: CashRegisterOpen,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if there's already an open register
    existing = db.query(CashRegister).filter(
        CashRegister.franchise_id == current_user.franchise_id,
        CashRegister.status == "open"
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ya hay una caja abierta")
    
    register = CashRegister(
        franchise_id=current_user.franchise_id,
        opening_amount=data.opening_amount,
        status="open"
    )
    db.add(register)
    db.commit()
    db.refresh(register)
    return register


@router.post("/cash-register/{register_id}/close")
def close_cash_register(
    register_id: int,
    closing_amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    register = db.query(CashRegister).filter(
        CashRegister.id == register_id,
        CashRegister.franchise_id == current_user.franchise_id
    ).first()
    
    if not register:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    
    if register.status == "closed":
        raise HTTPException(status_code=400, detail="La caja ya está cerrada")
    
    # Calculate expected amount
    movements_total = sum(m.amount for m in register.movements if m.type == "income")
    expenses_total = sum(m.amount for m in register.movements if m.type in ["expense", "withdrawal"])
    sales_total = sum(s.total for s in register.sales if s.status == "completed" and s.payment_method == "cash")
    
    expected = register.opening_amount + movements_total + sales_total - expenses_total
    
    register.closing_amount = closing_amount
    register.expected_amount = expected
    register.difference = closing_amount - expected
    register.closed_at = datetime.utcnow()
    register.status = "closed"
    
    db.commit()
    
    return {
        "closing_amount": closing_amount,
        "expected_amount": expected,
        "difference": register.difference,
        "status": "closed"
    }


@router.post("/cash-register/{register_id}/movements", response_model=dict)
def add_cash_movement(
    register_id: int,
    data: CashMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    register = db.query(CashRegister).filter(
        CashRegister.id == register_id,
        CashRegister.franchise_id == current_user.franchise_id,
        CashRegister.status == "open"
    ).first()
    
    if not register:
        raise HTTPException(status_code=404, detail="Caja no encontrada o cerrada")
    
    movement = CashMovement(
        cash_register_id=register_id,
        **data.model_dump()
    )
    db.add(movement)
    db.commit()
    
    return {"message": "Movimiento registrado", "id": movement.id}


# ============= SALES =============

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[SaleItemCreate]
    payment_method: str = Field(..., pattern="^(cash|card|transfer|mercadopago)$")
    payment_reference: Optional[str] = None
    discount: float = Field(default=0, ge=0)
    notes: Optional[str] = None


class SaleResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    subtotal: float
    tax: float
    discount: float
    total: float
    payment_method: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/sales", response_model=SaleResponse)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get open cash register
    cash_register = db.query(CashRegister).filter(
        CashRegister.franchise_id == current_user.franchise_id,
        CashRegister.status == "open"
    ).first()
    
    if not cash_register:
        raise HTTPException(status_code=400, detail="No hay caja abierta")
    
    # Calculate totals
    subtotal = 0
    items_data = []
    
    for item_data in data.items:
        product = db.query(Product).filter(
            Product.id == item_data.product_id,
            Product.franchise_id == current_user.franchise_id
        ).first()
        
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto {item_data.product_id} no encontrado")
        
        item_total = item_data.quantity * item_data.unit_price
        subtotal += item_total
        
        items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item_data.quantity,
            "unit_price": item_data.unit_price,
            "total": item_total
        })
    
    tax = 0  # Add tax calculation if needed
    total = subtotal - data.discount + tax
    
    # Create sale
    sale = Sale(
        franchise_id=current_user.franchise_id,
        customer_id=data.customer_id,
        employee_id=current_user.id,
        cash_register_id=cash_register.id,
        subtotal=subtotal,
        tax=tax,
        discount=data.discount,
        total=total,
        payment_method=data.payment_method,
        payment_reference=data.payment_reference,
        notes=data.notes,
        status="completed"
    )
    db.add(sale)
    db.flush()
    
    # Create sale items and update stock
    for item in items_data:
        sale_item = SaleItem(sale_id=sale.id, **item)
        db.add(sale_item)
        
        # Update product stock
        product = db.query(Product).filter(Product.id == item["product_id"]).first()
        if product:
            product.current_stock -= item["quantity"]
    
    # Update customer balance if credit
    if data.customer_id:
        customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
        if customer and data.payment_method != "cash":
            customer.balance += total
    
    db.commit()
    db.refresh(sale)
    
    return sale


@router.get("/sales", response_model=List[SaleResponse])
def list_sales(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Sale).filter(Sale.franchise_id == current_user.franchise_id)
    
    if date_from:
        query = query.filter(Sale.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(Sale.created_at <= datetime.combine(date_to, datetime.max.time()))
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if payment_method:
        query = query.filter(Sale.payment_method == payment_method)
    
    return query.order_by(Sale.created_at.desc()).all()


@router.get("/sales/today-summary")
def get_today_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    today = datetime.utcnow().date()
    
    sales = db.query(Sale).filter(
        Sale.franchise_id == current_user.franchise_id,
        Sale.created_at >= datetime.combine(today, datetime.min.time()),
        Sale.status == "completed"
    ).all()
    
    total_cash = sum(s.total for s in sales if s.payment_method == "cash")
    total_card = sum(s.total for s in sales if s.payment_method == "card")
    total_transfer = sum(s.total for s in sales if s.payment_method == "transfer")
    total_mercadopago = sum(s.total for s in sales if s.payment_method == "mercadopago")
    
    return {
        "date": today.isoformat(),
        "total_sales": len(sales),
        "total_amount": sum(s.total for s in sales),
        "by_payment_method": {
            "cash": total_cash,
            "card": total_card,
            "transfer": total_transfer,
            "mercadopago": total_mercadopago
        }
    }
