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
from models.franchise import Franchise
from schemas import Invoice as InvoiceSchema, ApproveLineRequest
from auth import get_current_active_user, get_admin_user, check_permission

router = APIRouter(prefix="/invoices", tags=["invoices"])
logger = logging.getLogger(__name__)


def get_invoice_filter(InvoiceModel, current_user: User):
    """Get filter for invoices based on user role. Superadmin sees all."""
    if current_user.role == "superadmin":
        return True  # No filter
    return InvoiceModel.franchise_id == current_user.franchise_id


def get_product_filter(ProductModel, current_user: User):
    """Get filter for products based on user role. Superadmin sees all."""
    if current_user.role == "superadmin":
        return True  # No filter
    return ProductModel.franchise_id == current_user.franchise_id

def parse_with_ai(text: str) -> Optional[dict]:
    """Usar Groq AI para extraer datos estructurados del texto del PDF"""
    api_key = os.getenv("GROQ_API_KEY", "")
    
    if not api_key:
        logger.warning("GROQ_API_KEY not configured, falling back to regex parser")
        return None
    
    try:
        from groq import Groq
        
        client = Groq(api_key=api_key)
        
        # Truncar texto si es muy largo (límite de tokens)
        max_chars = 8000
        truncated_text = text[:max_chars] if len(text) > max_chars else text
        
        prompt = f"""Extrae los datos de esta factura de Helacor S.A. (proveedor de helados Grido).

TEXTO DE LA FACTURA:
{truncated_text}

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
        logger.info(f"Groq response preview: {response_text[:200]}...")
        
        # Limpiar posibles caracteres de markdown
        if response_text.startswith("```"):
            response_text = re.sub(r'^```json?\s*', '', response_text)
            response_text = re.sub(r'\s*```$', '', response_text)
        
        data = json.loads(response_text)
        logger.info(f"Groq extracted {len(data.get('lineas', []))} lines")
        return data
    except json.JSONDecodeError as e:
        logger.error(f"Groq returned invalid JSON: {e}")
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
                        # Formato: DESCRIPCIÓN CANTIDAD KG/LT PRECIO IMPORTE
                        patterns = [
                            r'^(\d{4,})\s+(.+?)\s+([\d.,]+)\s+\$?([\d.,]+)\s+\$?([\d.,]+)',
                            r'^(.+?)\s+([\d.,]+)\s+(kg|lt|uni|cm3|pote)\s+\$?([\d.,]+)\s+\$?([\d.,]+)',
                            r'^(HELADO.+?)\s+([\d.,]+)\s+\$?([\d.,]+)',
                            # New pattern for "PRODUCTO CANTIDAD,000 KG/PRECIO" format
                            r'^([A-Za-z\s]+)\s+([\d.,]+)\s+(?:KG|LT|UNI)\s+\$?([\d.,]+)',
                        ]
                        
                        for pattern in patterns:
                            match = re.search(pattern, line, re.IGNORECASE)
                            if match:
                                try:
                                    groups = match.groups()
                                    if len(groups) >= 3:
                                        name = groups[0].strip()
                                        qty_str = groups[1].strip()
                                        price_str = groups[2].strip()
                                        total_str = groups[3].strip() if len(groups) >= 4 else "0"
                                        
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
            
            # Helacor format: "PRODUCTO ... QTY PRICE TOTAL ARS"
            # Example: "LIMON AL AGUA 7,800 KG GRIDO 21.00 % 2 13.014,28 ARS 26.028,56 ARS"
            helacor_pattern = r'^([A-Z][A-Z0-9\s]{4,}(?:KG|LT|UNI)?(?:\s*GRIDO)?)\s+[\d.,]+\s*%\s+(\d+)\s+([\d.,]+)\s+ARS\s+([\d.,]+)\s+ARS'
            
            for line in raw_text.split('\n'):
                line = line.strip()
                if not line or len(line) < 20:
                    continue
                
                # Skip header lines
                lower_line = line.lower()
                if any(skip in lower_line for skip in ['factura', 'cuit', 'código', 'localidad', 'domicilio', 'teléfono', 'email', 'IVA RESPONSABLE']):
                    continue
                
                # Try Helacor pattern
                match = re.match(helacor_pattern, line, re.IGNORECASE)
                if match:
                    try:
                        name = match.group(1).strip()
                        qty = float(match.group(2))
                        price = float(match.group(3).replace('.', '').replace(',', '.'))
                        total = float(match.group(4).replace('.', '').replace(',', '.'))
                        
                        if name and len(name) > 5 and qty > 0 and price > 0:
                            unit = extract_unit_from_text(line)
                            if unit == "7.8kg" and "KG" in line.upper():
                                unit = "7.8kg"
                            elif unit == "1lt" and "LT" in line.upper():
                                unit = "1lt"
                            
                            if not any(l['raw_name'] == name and l['quantity'] == qty for l in lines_data):
                                lines_data.append({
                                    "raw_name": name,
                                    "quantity": qty,
                                    "unit_price": price,
                                    "total": total,
                                    "unit": unit
                                })
                                total += total
                                lines_found = True
                                logger.info(f"Found line via Helacor pattern: {name}, qty: {qty}")
                    except (ValueError, TypeError):
                        continue
            
            # Original pattern matching as fallback
            product_keywords = ['helado', 'grido', 'bombon', 'cono', 'vaso', 'palito', 'torta', 'kg', 'lt', 'pote', 'uni', 'agua', 'leche', 'crema']
            
            # More flexible pattern matching for Helacor invoices
            # Matches: PRODUCTO CANTIDAD KG $PRECIO or PRODUCTO CANTIDAD,000 KG/PRECIO
            text_patterns = [
                r'^([A-Za-z\s]{4,})\s+([\d.,]+)\s*(kg|lt|uni|pote)?\s*\$?\s*([\d.,]+)',
                r'([A-Za-z\s]{4,})\s+([\d.,]+)\s*(kg|lt|uni|pote)?.*?\$?\s*([\d.,]+)',
            ]
            
            for line in raw_text.split('\n'):
                line = line.strip()
                if not line or len(line) < 10:
                    continue
                
                # Skip header/footer lines
                if any(skip in line.lower() for skip in ['factura', 'total', 'subtotal', 'iva', 'importe', 'fecha', 'cuit', 'direccion', 'teléfono']):
                    if not any(kw in line.lower() for kw in product_keywords):
                        continue
                
                for pattern in text_patterns:
                    match = re.match(pattern, line, re.IGNORECASE)
                    if match:
                        try:
                            name = match.group(1).strip()
                            qty_str = match.group(2).strip()
                            
                            # Get price from the appropriate group
                            if match.lastindex and match.lastindex >= 4:
                                price_str = match.group(4)
                            elif match.lastindex and match.lastindex >= 3:
                                price_str = match.group(3)
                            else:
                                continue
                            
                            if not price_str:
                                continue
                            
                            qty = float(re.sub(r'[^\d.]', '', qty_str))
                            price = float(re.sub(r'[^\d.,]', '', price_str).replace(',', '.'))
                            
                            if name and len(name) > 4 and qty > 0 and price > 0:
                                unit = extract_unit_from_text(line)
                                line_total = qty * price
                                
                                # Avoid duplicates
                                if not any(l['raw_name'] == name and l['quantity'] == qty for l in lines_data):
                                    lines_data.append({
                                        "raw_name": name,
                                        "quantity": qty,
                                        "unit_price": price,
                                        "total": line_total,
                                        "unit": unit
                                    })
                                    total += line_total
                                    lines_found = True
                                    logger.info(f"Found line via text pattern: {name}, qty: {qty}, price: {price}")
                        except (ValueError, TypeError) as e:
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

from schemas.invoice import UnknownProduct, InvoiceUploadResponse

@router.post("/upload", response_model=InvoiceUploadResponse)
async def upload_invoice(
    file: UploadFile = File(...),
    franchise_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("invoices:upload"))
):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")
    
    # Determine franchise_id based on user role
    if current_user.role == "superadmin":
        if franchise_id is None:
            raise HTTPException(status_code=400, detail="Superadmin debe especificar franchise_id como query parameter")
        # Verify franchise exists
        franchise = db.query(Franchise).filter(Franchise.id == franchise_id).first()
        if not franchise:
            raise HTTPException(status_code=404, detail="Franquicia no encontrada")
        target_franchise_id = franchise_id
    else:
        target_franchise_id = current_user.franchise_id
    
    file_bytes = await file.read()
    logger.info(f"Uploading invoice: {file.filename}, size: {len(file_bytes)} bytes")
    
    parsed = parse_invoice_pdf(file_bytes, db, target_franchise_id)
    logger.info(f"Parsed invoice: {parsed['number']}, lines: {len(parsed['lines'])}, total: {parsed['total']}")
    
    existing = db.query(Invoice).filter(Invoice.number == parsed["number"]).first()
    if existing:
        logger.info(f"Invoice {parsed['number']} already exists")
        return InvoiceUploadResponse(
            invoice=InvoiceSchema.model_validate(existing),
            unknown_products=[]
        )
    
    invoice = Invoice(
        number=parsed["number"],
        date=parsed["date"],
        supplier="Helacor S.A.",
        total=parsed["total"],
        raw_text=parsed["raw_text"],
        franchise_id=target_franchise_id,
        status="pending"
    )
    db.add(invoice)
    db.flush()
    
    product_filter = get_product_filter(Product, current_user)
    products_query = db.query(Product)
    if product_filter is not True:
        products_query = products_query.filter(product_filter)
    products = products_query.all()
    
    matched_count = 0
    unknown_products = []
    for line_data in parsed["lines"]:
        product, matched_name = match_product(line_data["raw_name"], products)
        previous_price = None
        price_change = 0
        if product:
            matched_count += 1
            previous_price = product.unit_price
            if previous_price and previous_price > 0:
                price_change = round(((line_data["unit_price"] - previous_price) / previous_price) * 100, 1)
        else:
            unknown_products.append(UnknownProduct(
                raw_name=line_data["raw_name"],
                quantity=line_data["quantity"],
                unit=line_data["unit"],
                unit_price=line_data["unit_price"],
                supplier=invoice.supplier
            ))
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
    
    logger.info(f"Created invoice {invoice.id} with {len(parsed['lines'])} lines, {matched_count} matched, {len(unknown_products)} unknown")
    
    db.commit()
    db.refresh(invoice)
    
    return InvoiceUploadResponse(
        invoice=InvoiceSchema.model_validate(invoice),
        unknown_products=unknown_products
    )


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

@router.post("/{invoice_id}/reprocess")
def reprocess_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_permission("invoices:upload"))
):
    """Re-process an invoice to extract lines from raw_text"""
    franchise_filter = get_invoice_filter(Invoice, current_user)
    query = db.query(Invoice).filter(Invoice.id == invoice_id)
    if franchise_filter is not True:
        query = query.filter(franchise_filter)
    invoice = query.first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    if not invoice.raw_text:
        raise HTTPException(status_code=400, detail="La factura no tiene texto sin procesar")
    
    # Re-parse using AI
    parsed = parse_with_ai(invoice.raw_text)
    
    if parsed and parsed.get("lineas"):
        # Clear existing lines
        db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice.id).delete()
        
        # Add new lines
        products = db.query(Product).filter(
            Product.franchise_id == current_user.franchise_id
        ).all()
        
        for linea in parsed.get("lineas", []):
            if linea.get("producto") and linea.get("cantidad"):
                unit = linea.get("unidad", "7.8kg")
                if not unit or unit == "null":
                    unit = "7.8kg"
                
                product, matched_name = match_product(linea["producto"], products)
                
                line = InvoiceLine(
                    invoice_id=invoice.id,
                    raw_name=linea["producto"],
                    matched_name=matched_name,
                    quantity=float(linea["cantidad"]),
                    unit_price=float(linea.get("precio_unitario", 0)),
                    total=float(linea.get("total", 0)),
                    unit=unit,
                    is_matched=product is not None,
                    product_id=product.id if product else None
                )
                db.add(line)
        
        if parsed.get("total"):
            invoice.total = float(parsed["total"])
        
        db.commit()
        db.refresh(invoice)
        
        return {"success": True, "lines_count": len(parsed.get("lineas", [])), "invoice": InvoiceSchema.model_validate(invoice)}
    
    raise HTTPException(status_code=400, detail="No se pudieron extraer líneas de la factura")

@router.get("", response_model=List[InvoiceSchema])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    franchise_filter = get_invoice_filter(Invoice, current_user)
    query = db.query(Invoice)
    if franchise_filter is not True:
        query = query.filter(franchise_filter)
    return query.order_by(Invoice.created_at.desc()).all()

@router.get("/all", response_model=List[InvoiceSchema])
def list_all_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all invoices - admin/superadmin only"""
    return db.query(Invoice).order_by(Invoice.created_at.desc()).all()

@router.get("/{invoice_id}", response_model=InvoiceSchema)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    franchise_filter = get_invoice_filter(Invoice, current_user)
    query = db.query(Invoice).filter(Invoice.id == invoice_id)
    if franchise_filter is not True:
        query = query.filter(franchise_filter)
    invoice = query.first()
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
    franchise_filter = get_invoice_filter(Invoice, current_user)
    query = db.query(Invoice).filter(Invoice.id == invoice_id)
    if franchise_filter is not True:
        query = query.filter(franchise_filter)
    invoice = query.first()
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
