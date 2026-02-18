from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import io
import re
from database import get_db
from models.user import User
from models.product import Product
from models.invoice import Invoice, InvoiceLine
from schemas import Invoice as InvoiceSchema, ApproveLineRequest
from auth import get_current_active_user, get_admin_user

router = APIRouter(prefix="/invoices", tags=["invoices"])

def parse_invoice_pdf(file_bytes: bytes, db: Session, franchise_id: int) -> dict:
    import pdfplumber
    
    lines_data = []
    invoice_number = ""
    invoice_date = None
    total = 0
    
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
            
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if row and len(row) >= 4:
                        try:
                            name = str(row[0]) if row[0] else ""
                            if not name or name.startswith("Código") or name.startswith("Descripción"):
                                continue
                            
                            qty_str = str(row[2]) if len(row) > 2 else "0"
                            price_str = str(row[3]) if len(row) > 3 else "0"
                            total_str = str(row[4]) if len(row) > 4 else "0"
                            
                            qty = float(re.sub(r'[^\d.]', '', qty_str) or 0)
                            price = float(re.sub(r'[^\d.]', '', price_str) or 0)
                            line_total = float(re.sub(r'[^\d.]', '', total_str) or 0)
                            
                            if name and qty > 0 and price > 0:
                                lines_data.append({
                                    "raw_name": name.strip(),
                                    "quantity": qty,
                                    "unit_price": price,
                                    "total": line_total if line_total > 0 else qty * price,
                                    "unit": "7.8kg"
                                })
                                total += line_total if line_total > 0 else qty * price
                        except (ValueError, TypeError):
                            continue
        
        number_match = re.search(r'N°\s*(\d{4}-\d{8})', full_text)
        if number_match:
            invoice_number = number_match.group(1)
        
        date_match = re.search(r'(\d{2}\.\d{2}\.\d{4})', full_text)
        if date_match:
            from datetime import datetime
            invoice_date = datetime.strptime(date_match.group(1), "%d.%m.%Y")
    
    return {
        "number": invoice_number or f"TEMP-{len(lines_data)}",
        "date": invoice_date,
        "total": total,
        "lines": lines_data,
        "raw_text": ""
    }

def match_product(raw_name: str, products: List[Product]) -> tuple:
    clean_name = raw_name
    for pattern in [r'\d+[,.]?\d*\s*KG', r'GRIDO\s*$', r'PACK\s*X?\d*', r'X\s*\d+']:
        clean_name = re.sub(pattern, '', clean_name, flags=re.IGNORECASE)
    clean_name = ' '.join(clean_name.split()).strip()
    
    normalized = clean_name.lower().normalize('NFKD').encode('ASCII', 'ignore').decode('ASCII')
    
    for product in products:
        prod_normalized = product.name.lower().normalize('NFKD').encode('ASCII', 'ignore').decode('ASCII')
        if normalized in prod_normalized or prod_normalized in normalized:
            return product, clean_name
    
    return None, clean_name

@router.post("/upload", response_model=InvoiceSchema)
async def upload_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")
    
    file_bytes = await file.read()
    parsed = parse_invoice_pdf(file_bytes, db, current_user.franchise_id)
    
    existing = db.query(Invoice).filter(Invoice.number == parsed["number"]).first()
    if existing:
        return InvoiceSchema.model_validate(existing)
    
    invoice = Invoice(
        number=parsed["number"],
        date=parsed["date"],
        supplier="Helacor S.A.",
        total=parsed["total"],
        raw_text=parsed["raw_text"],
        franchise_id=current_user.franchise_id,
        status="pending"
    )
    db.add(invoice)
    db.flush()
    
    products = db.query(Product).filter(
        Product.franchise_id == current_user.franchise_id
    ).all()
    
    for line_data in parsed["lines"]:
        product, matched_name = match_product(line_data["raw_name"], products)
        
        previous_price = None
        price_change = 0
        if product:
            previous_price = product.unit_price
            if previous_price and previous_price > 0:
                price_change = round(((line_data["unit_price"] - previous_price) / previous_price) * 100, 1)
        
        line = InvoiceLine(
            invoice_id=invoice.id,
            raw_name=line_data["raw_name"],
            matched_name=matched_name,
            quantity=line_data["quantity"],
            unit=line_data["unit"],
            unit_price=line_data["unit_price"],
            previous_price=previous_price,
            price_change_pct=price_change,
            total=line_data["total"],
            is_matched=product is not None,
            product_id=product.id if product else None
        )
        db.add(line)
    
    db.commit()
    db.refresh(invoice)
    
    return InvoiceSchema.model_validate(invoice)

@router.get("", response_model=List[InvoiceSchema])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Invoice).filter(
        Invoice.franchise_id == current_user.franchise_id
    ).order_by(Invoice.created_at.desc()).all()

@router.get("/{invoice_id}", response_model=InvoiceSchema)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.franchise_id == current_user.franchise_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return InvoiceSchema.model_validate(invoice)

@router.post("/{invoice_id}/lines/{line_id}/approve", response_model=InvoiceSchema)
def approve_line(
    invoice_id: int,
    line_id: int,
    request: ApproveLineRequest = ApproveLineRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.franchise_id == current_user.franchise_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    line = db.query(InvoiceLine).filter(
        InvoiceLine.id == line_id,
        InvoiceLine.invoice_id == invoice_id
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Línea no encontrada")
    
    line.approved = True
    if request.product_id:
        line.product_id = request.product_id
        line.is_matched = True
    
    db.commit()
    db.refresh(invoice)
    return InvoiceSchema.model_validate(invoice)

@router.post("/{invoice_id}/confirm", response_model=InvoiceSchema)
def confirm_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.franchise_id == current_user.franchise_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if invoice.status == "confirmed":
        raise HTTPException(status_code=400, detail="Factura ya confirmada")
    
    for line in invoice.lines:
        if line.approved and line.product_id:
            product = db.query(Product).filter(Product.id == line.product_id).first()
            if product:
                product.current_stock += line.quantity
                product.unit_price = line.unit_price
                product.previous_price = line.previous_price
    
    invoice.status = "confirmed"
    db.commit()
    db.refresh(invoice)
    
    return InvoiceSchema.model_validate(invoice)
