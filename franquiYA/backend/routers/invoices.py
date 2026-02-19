from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import io
import re
import logging
from datetime import datetime
from database import get_db
from models.user import User
from models.product import Product
from models.invoice import Invoice, InvoiceLine
from schemas import Invoice as InvoiceSchema, ApproveLineRequest
from auth import get_current_active_user, get_admin_user

router = APIRouter(prefix="/invoices", tags=["invoices"])
logger = logging.getLogger(__name__)

def parse_invoice_pdf(file_bytes: bytes, db: Session, franchise_id: int) -> dict:
    import pdfplumber
    
    lines_data = []
    invoice_number = ""
    invoice_date = None
    total = 0
    raw_text = ""
    
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    raw_text += text + "\n"
                
                logger.info(f"Processing page {page_num + 1}")
                
                # ESTRATEGIA 1: Tablas con bordes estándar
                tables = page.extract_tables()
                logger.info(f"Strategy 1 (borders): Found {len(tables)} tables")
                
                for table in tables:
                    for row in table:
                        if row and len(row) >= 4:
                            try:
                                name = str(row[0] or "").strip()
                                if not name or name.lower() in ["código", "descripción", "producto", "total"]:
                                    continue
                                
                                qty_str = str(row[2] if len(row) > 2 else "0")
                                price_str = str(row[3] if len(row) > 3 else "0")
                                total_str = str(row[4] if len(row) > 4 else "0")
                                
                                qty = float(re.sub(r'[^\d.]', '', qty_str) or 0)
                                price = float(re.sub(r'[^\d.]', '', price_str) or 0)
                                line_total = float(re.sub(r'[^\d.]', '', total_str) or 0)
                                
                                if name and qty > 0 and price > 0:
                                    lines_data.append({
                                        "raw_name": name,
                                        "quantity": qty,
                                        "unit_price": price,
                                        "total": line_total if line_total > 0 else qty * price,
                                        "unit": "7.8kg"
                                    })
                                    total += line_total if line_total > 0 else qty * price
                            except (ValueError, TypeError, IndexError) as e:
                                continue
                
                # ESTRATEGIA 2: Tablas sin bordes (text-based)
                if not lines_data:
                    tables_text = page.extract_tables({
                        "vertical_strategy": "text",
                        "horizontal_strategy": "text"
                    })
                    logger.info(f"Strategy 2 (text-based): Found {len(tables_text)} tables")
                    
                    for table in tables_text:
                        for row in table:
                            if row and len(row) >= 3:
                                try:
                                    name = str(row[0] or "").strip()
                                    if not name or len(name) < 3:
                                        continue
                                    
                                    # Buscar números en las últimas columnas
                                    numbers = []
                                    for cell in row[1:]:
                                        if cell:
                                            num_str = re.sub(r'[^\d.,]', '', str(cell))
                                            if num_str:
                                                num = float(num_str.replace(',', '.'))
                                                numbers.append(num)
                                    
                                    if len(numbers) >= 2 and numbers[0] > 0:
                                        qty = numbers[0]
                                        price = numbers[1] if len(numbers) > 1 else 0
                                        line_total = numbers[2] if len(numbers) > 2 else qty * price
                                        
                                        lines_data.append({
                                            "raw_name": name,
                                            "quantity": qty,
                                            "unit_price": price,
                                            "total": line_total,
                                            "unit": "7.8kg"
                                        })
                                        total += line_total
                                except (ValueError, TypeError):
                                    continue
                
                # ESTRATEGIA 3: Regex sobre texto plano
                if not lines_data and text:
                    logger.info("Strategy 3: Trying regex on plain text")
                    
                    # Patrones para líneas de factura
                    patterns = [
                        # "DULCE DE LECHE 7.800 KG 3 24,545.06 73,635.18"
                        r'([A-ZÁÉÍÓÚÑ\s]+?)\s+[\d.,]+\s*(?:KG|LT|UNI)?\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)',
                        # "DULCE DE LECHE X 3 24.545,06"
                        r'([A-ZÁÉÍÓÚÑ\s]+?)\s+X\s*(\d+)\s+([\d.,]+)',
                        # Líneas con cantidad y precio
                        r'^([A-ZÁÉÍÓÚÑa-z\s]+?)\s+(\d+)\s+([\d.,]+)$',
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, text, re.MULTILINE)
                        logger.info(f"Pattern matches: {len(matches)}")
                        
                        for match in matches:
                            try:
                                if len(match) >= 3:
                                    name = match[0].strip()
                                    qty = float(re.sub(r'[^\d.]', '', match[1]))
                                    price = float(re.sub(r'[^\d.]', '', match[2].replace(',', '.')))
                                    
                                    if name and qty > 0 and price > 0:
                                        line_total = float(re.sub(r'[^\d.]', '', match[3].replace(',', '.'))) if len(match) > 3 else qty * price
                                        
                                        lines_data.append({
                                            "raw_name": name,
                                            "quantity": qty,
                                            "unit_price": price,
                                            "total": line_total,
                                            "unit": "7.8kg"
                                        })
                                        total += line_total
                            except (ValueError, TypeError, IndexError):
                                continue
                        
                        if lines_data:
                            break
            
            # Extraer número de factura con múltiples patrones
            number_patterns = [
                r'N[°º]?\s*(\d{4}[-\s]?\d{8})',
                r'Factura\s*N[°º]?\s*(\d{4}[-\s]?\d{8})',
                r'(\d{4}[-\s]\d{8})',
                r'Comprobante[:\s]+(\d+)',
                r'N[°º][:.\s]+(\d+)',
            ]
            
            for pattern in number_patterns:
                match = re.search(pattern, raw_text, re.IGNORECASE)
                if match:
                    invoice_number = match.group(1).replace(' ', '-')
                    logger.info(f"Invoice number found: {invoice_number}")
                    break
            
            # Extraer fecha
            date_patterns = [
                r'(\d{2}[./]\d{2}[./]\d{4})',
                r'(\d{4}[./]\d{2}[./]\d{2})',
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, raw_text)
                if match:
                    date_str = match.group(1)
                    for fmt in ["%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d"]:
                        try:
                            invoice_date = datetime.strptime(date_str, fmt)
                            logger.info(f"Invoice date found: {invoice_date}")
                            break
                        except ValueError:
                            continue
                    if invoice_date:
                        break
            
            # Extraer total
            total_patterns = [
                r'Total[:\s]+\$?\s*([\d.,]+)',
                r'TOTAL[:\s]+\$?\s*([\d.,]+)',
                r'Importe\s+Total[:\s]+\$?\s*([\d.,]+)',
            ]
            
            for pattern in total_patterns:
                match = re.search(pattern, raw_text)
                if match:
                    try:
                        total = float(re.sub(r'[^\d.]', '', match.group(1).replace(',', '.')))
                        logger.info(f"Total found: {total}")
                        break
                    except ValueError:
                        continue
    
    except Exception as e:
        logger.error(f"Error parsing PDF: {str(e)}")
    
    logger.info(f"Parsed {len(lines_data)} lines from PDF")
    
    return {
        "number": invoice_number or f"TEMP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "date": invoice_date or datetime.now(),
        "total": total,
        "lines": lines_data,
        "raw_text": raw_text[:2000] if raw_text else ""
    }

def match_product(raw_name: str, products: List[Product]) -> tuple:
    import unicodedata
    
    clean_name = raw_name
    for pattern in [r'\d+[,.]?\d*\s*KG', r'GRIDO\s*$', r'PACK\s*X?\d*', r'X\s*\d+', r'\s+LT\b']:
        clean_name = re.sub(pattern, '', clean_name, flags=re.IGNORECASE)
    clean_name = ' '.join(clean_name.split()).strip()
    
    normalized = unicodedata.normalize('NFKD', clean_name.lower()).encode('ASCII', 'ignore').decode('ASCII')
    
    for product in products:
        prod_normalized = unicodedata.normalize('NFKD', product.name.lower()).encode('ASCII', 'ignore').decode('ASCII')
        if normalized in prod_normalized or prod_normalized in normalized:
            return product, clean_name
    
    return None, clean_name

@router.post("/upload", response_model=InvoiceSchema)
async def upload_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")
    
    file_bytes = await file.read()
    logger.info(f"Uploading invoice: {file.filename}, size: {len(file_bytes)} bytes")
    
    parsed = parse_invoice_pdf(file_bytes, db, current_user.franchise_id)
    logger.info(f"Parsed invoice: {parsed['number']}, lines: {len(parsed['lines'])}, total: {parsed['total']}")
    
    existing = db.query(Invoice).filter(Invoice.number == parsed["number"]).first()
    if existing:
        logger.info(f"Invoice {parsed['number']} already exists")
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
    
    matched_count = 0
    for line_data in parsed["lines"]:
        product, matched_name = match_product(line_data["raw_name"], products)
        
        previous_price = None
        price_change = 0
        if product:
            matched_count += 1
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
    
    logger.info(f"Created invoice {invoice.id} with {len(parsed['lines'])} lines, {matched_count} matched")
    
    db.commit()
    db.refresh(invoice)
    
    return InvoiceSchema.model_validate(invoice)

@router.post("/debug")
async def debug_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_admin_user)
):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")
    
    import pdfplumber
    
    file_bytes = await file.read()
    debug_info = {
        "filename": file.filename,
        "size_bytes": len(file_bytes),
        "pages": []
    }
    
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                
                tables_bordered = page.extract_tables()
                tables_borderless = page.extract_tables({
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text"
                })
                
                debug_info["pages"].append({
                    "page_number": i + 1,
                    "text_length": len(text),
                    "text_preview": text[:500] if text else None,
                    "tables_with_borders": len(tables_bordered),
                    "tables_borderless": len(tables_borderless),
                    "tables_preview": str(tables_bordered[:2])[:1000] if tables_bordered else None
                })
    except Exception as e:
        debug_info["error"] = str(e)
    
    return debug_info

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

@router.post("/{invoice_id}/approve-all", response_model=InvoiceSchema)
def approve_all_lines(
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
    
    approved_count = 0
    for line in invoice.lines:
        if line.is_matched and not line.approved:
            line.approved = True
            approved_count += 1
    
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
