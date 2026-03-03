from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import re
import os
import json
import logging
from datetime import datetime
from database import get_db
from models.user import User
from models.product import Product
from models.invoice import Invoice, InvoiceLine
from schemas import Invoice as InvoiceSchema, ApproveLineRequest
from auth import get_current_active_user, get_admin_user, check_permission

router = APIRouter(prefix="/invoices", tags=["invoices"])
logger = logging.getLogger(__name__)

def parse_with_ai(text: str) -> Optional[dict]:
    """Usar Groq AI para extraer datos estructurados del texto del PDF"""
    api_key = os.getenv("GROQ_API_KEY", "")
    
    if not api_key:
        logger.warning("GROQ_API_KEY not configured, falling back to regex parser")
        return None
    
    try:
        from groq import Groq
        
        client = Groq(api_key=api_key)
        
        prompt = f"""Extrae los datos de esta factura de Helacor S.A. (proveedor de helados Grido).

TEXTO DE LA FACTURA:
{text}

Devuelve SOLO un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{{
    "numero_factura": "número de factura o null",
    "fecha": "DD/MM/YYYY o null",
    "lineas": [
        {{
            "producto": "nombre del producto",
            "cantidad": numero,
            "precio_unitario": numero,
            "total": numero,
            "unidad": "kg, lt, un, etc"
        }}
    ],
    "total": numero
}}

IMPORTANTE:
- Extrae TODAS las líneas de productos
- Los precios están en pesos argentinos
- Detecta la unidad de cada producto (7.8kg, 1lt, 12uni, etc)
- Devuelve solo el JSON, nada más"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Sos un asistente que extrae datos de facturas. Solo devolvés JSON, sin texto adicional."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Limpiar posibles caracteres de markdown
        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\s*', '', response_text)
            response_text = re.sub(r'\s*```$', '', response_text)
        
        data = json.loads(response_text)
        logger.info(f"Groq extracted {len(data.get('lineas', []))} lines")
        return data
        
    except json.JSONDecodeError as e:
        logger.error(f"Groq JSON parse error: {e}")
        return None
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return None

def extract_unit_from_text(text: str) -> str:
    """Extraer la unidad del producto del texto"""
    text_lower = text.lower()
    if 'kg' in text_lower:
        match = re.search(r'([\d.,]+)\s*kg', text_lower)
        if match:
            return f"{match.group(1)}kg"
        return "kg"
    if 'lt' in text_lower or 'lts' in text_lower:
        match = re.search(r'([\d.,]+)\s*lt', text_lower)
        if match:
            return f"{match.group(1)}lt"
        return "lt"
    if 'uni' in text_lower or 'un' in text_lower:
        match = re.search(r'([\d.,]+)\s*uni', text_lower)
        if match:
            return f"{match.group(1)}uni"
        return "uni"
    if 'cm3' in text_lower:
        return "cm3"
    if 'pack' in text_lower or 'pote' in text_lower:
        match = re.search(r'pack\s*x?\s*(\d+)', text_lower)
        if match:
            return f"Pack x{match.group(1)}"
        return "Pack"
    return "7.8kg"

def parse_invoice_pdf(file_bytes: bytes, db: Session, franchise_id: int) -> dict:
    import pdfplumber
    
    lines_data = []
    invoice_number = ""
    invoice_date = None
    total = 0
    raw_text = ""
    
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    raw_text += text + "\n"
        
        # INTENTAR PRIMERO CON GEMINI
        gemini_result = parse_with_ai(raw_text)
        
        if gemini_result and gemini_result.get("lineas"):
            logger.info("Using Gemini parsed data")
            
            invoice_number = gemini_result.get("numero_factura", "")
            
            if gemini_result.get("fecha"):
                try:
                    invoice_date = datetime.strptime(gemini_result["fecha"], "%d/%m/%Y")
                except:
                    pass
            
            for linea in gemini_result.get("lineas", []):
                if linea.get("producto") and linea.get("cantidad"):
                    unit = linea.get("unidad", "7.8kg")
                    if not unit or unit == "null":
                        unit = "7.8kg"
                    lines_data.append({
                        "raw_name": linea["producto"],
                        "quantity": float(linea["cantidad"]),
                        "unit_price": float(linea.get("precio_unitario", 0)),
                        "total": float(linea.get("total", 0)),
                        "unit": unit
                    })
            
            total = float(gemini_result.get("total", 0))
            
            if lines_data:
                return {
                    "number": invoice_number or f"TEMP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "date": invoice_date or datetime.now(),
                    "total": total,
                    "lines": lines_data,
                    "raw_text": raw_text[:2000]
                }
        
        # FALLBACK: Parser mejorado para Helacor
        logger.info("Gemini failed or returned no data, using enhanced fallback parser")
        
        lines_found = False
        
        # ESTRATEGIA 1: Tablas con bordes
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row and len(row) >= 4:
                            try:
                                name = str(row[0] or "").strip()
                                if not name or name.lower() in ["código", "descripción", "producto", "total", "importe"]:
                                    continue
                                if len(name) < 3:
                                    continue
                                
                                qty_str = str(row[2] if len(row) > 2 else "0")
                                price_str = str(row[3] if len(row) > 3 else "0")
                                total_str = str(row[4] if len(row) > 4 else "0")
                                
                                qty = float(re.sub(r'[^\d.]', '', qty_str) or 0)
                                price = float(re.sub(r'[^\d.]', '', price_str) or 0)
                                line_total = float(re.sub(r'[^\d.]', '', total_str) or 0)
                                
                                if name and qty > 0 and price > 0:
                                    unit = extract_unit_from_text(name)
                                    lines_data.append({
                                        "raw_name": name,
                                        "quantity": qty,
                                        "unit_price": price,
                                        "total": line_total if line_total > 0 else qty * price,
                                        "unit": unit
                                    })
                                    total += line_total if line_total > 0 else qty * price
                                    lines_found = True
                            except (ValueError, TypeError, IndexError):
                                continue
        
        # ESTRATEGIA 2: Extracción por líneas de texto si no hay tablas
        if not lines_found:
            logger.info("No tables found, using text-based extraction")
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text:
                        continue
                    
                    for line in text.split('\n'):
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Patrones para líneas de factura Helacor
                        # Formato: CÓDIGO DESCRIPCIÓN CANTIDAD PRECIO UNITARIO IMPORTE
                        patterns = [
                            r'^(\d{4,})\s+(.+?)\s+([\d.,]+)\s+\$?([\d.,]+)\s+\$?([\d.,]+)',
                            r'^(.+?)\s+([\d.,]+)\s+(kg|lt|uni|cm3|pote)\s+\$?([\d.,]+)\s+\$?([\d.,]+)',
                            r'^(HELADO.+?)\s+([\d.,]+)\s+\$?([\d.,]+)',
                        ]
                        
                        for pattern in patterns:
                            match = re.search(pattern, line, re.IGNORECASE)
                            if match:
                                try:
                                    if len(match.groups()) >= 3:
                                        name = match.group(1).strip()
                                        qty_str = match.group(2).strip()
                                        price_str = match.group(3).strip()
                                        total_str = match.group(4).strip() if len(match.groups()) >= 4 else "0"
                                        
                                        qty = float(re.sub(r'[^\d.]', '', qty_str))
                                        price = float(re.sub(r'[^\d.,]', '', price_str).replace(',', '.'))
                                        line_total = float(re.sub(r'[^\d.,]', '', total_str).replace(',', '.')) if total_str != "0" else qty * price
                                        
                                        if name and len(name) > 3 and qty > 0:
                                            unit = extract_unit_from_text(line)
                                            lines_data.append({
                                                "raw_name": name,
                                                "quantity": qty,
                                                "unit_price": price,
                                                "total": line_total,
                                                "unit": unit
                                            })
                                            total += line_total
                                            lines_found = True
                                except (ValueError, TypeError):
                                    continue
        
        # ESTRATEGIA 3: Buscar patrones de productos en el texto completo
        if not lines_found:
            logger.info("Using raw text pattern matching")
            
            # Buscar líneas que contengan productos Grido/Helacor
            product_keywords = ['helado', 'grido', 'bombon', 'cono', 'vaso', 'palito', 'torta', 'kg', 'lt', 'pote', 'uni']
            
            for line in raw_text.split('\n'):
                line_lower = line.lower()
                if not any(kw in line_lower for kw in product_keywords):
                    continue
                    
                # Buscar números en la línea
                numbers = re.findall(r'[\d.,]+', line)
                if len(numbers) < 2:
                    continue
                
                try:
                    # Extraer nombre (todo antes de los números)
                    name_match = re.match(r'^([A-Za-z0-9\s\-_]+?)\s+', line)
                    if not name_match:
                        continue
                    
                    name = name_match.group(1).strip()
                    if len(name) < 5:
                        continue
                    
                    # Los últimos números son probablemente precios
                    nums = [float(n.replace(',', '.')) for n in numbers[-3:] if n]
                    if len(nums) >= 2:
                        qty = nums[0]
                        price = nums[1]
                        line_total = nums[2] if len(nums) >= 3 else qty * price
                        
                        if qty > 0 and price > 0:
                            unit = extract_unit_from_text(line)
                            lines_data.append({
                                "raw_name": name,
                                "quantity": qty,
                                "unit_price": price,
                                "total": line_total,
                                "unit": unit
                            })
                            total += line_total
                            lines_found = True
                except (ValueError, TypeError):
                    continue
        
        # Extraer número de factura
        number_patterns = [
            r'N[°º]?\s*(\d{4}[-\s]?\d{8})',
            r'Factura\s*N[°º]?\s*(\d{4}[-\s]?\d{8})',
            r'(\d{4}[-\s]\d{8})',
            r'F\s*[Aa]\s*(\d{4})[-\s]?(\d{8})',
        ]
        
        for pattern in number_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    invoice_number = f"{match.group(1)}-{match.group(2)}"
                else:
                    invoice_number = match.group(1).replace(' ', '-')
                break
        
        # Extraer fecha
        date_patterns = [r'(\d{2}[./]\d{2}[./]\d{4})', r'(\d{4}[./]\d{2}[./]\d{2})']
        
        for pattern in date_patterns:
            match = re.search(pattern, raw_text)
            if match:
                date_str = match.group(1)
                for fmt in ["%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d"]:
                    try:
                        invoice_date = datetime.strptime(date_str, fmt)
                        break
                    except ValueError:
                        continue
                if invoice_date:
                    break
        
        # Extraer total si no se encontró
        if total == 0:
            total_patterns = [r'Total[:\s]+\$?\s*([\d.,]+)', r'TOTAL[:\s]+\$?\s*([\d.,]+)', r'Importe\s*Total[:\s]+\$?\s*([\d.,]+)']
            for pattern in total_patterns:
                match = re.search(pattern, raw_text)
                if match:
                    try:
                        total = float(re.sub(r'[^\d.]', '', match.group(1).replace(',', '.')))
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
    current_user: User = Depends(check_permission("invoices:upload"))
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
        "gemini_available": bool(os.getenv("GOOGLE_API_KEY", "")),
        "pages": []
    }
    
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            full_text = ""
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                full_text += text + "\n"
                
                tables_bordered = page.extract_tables()
                
                debug_info["pages"].append({
                    "page_number": i + 1,
                    "text_length": len(text),
                    "text_preview": text[:500] if text else None,
                    "tables_count": len(tables_bordered)
                })
            
            # Test Gemini extraction
            if os.getenv("GOOGLE_API_KEY"):
                gemini_result = parse_with_ai(full_text)
                debug_info["gemini_result"] = gemini_result
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
    current_user: User = Depends(check_permission("invoices:approve"))
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
    current_user: User = Depends(check_permission("invoices:approve"))
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
    current_user: User = Depends(check_permission("invoices:approve"))
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
