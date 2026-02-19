from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import logging
from database import get_db
from models.user import User
from models.product import Product
from models.invoice import Invoice
from auth import get_current_active_user

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

def get_stock_summary(db: Session, franchise_id: int) -> str:
    products = db.query(Product).filter(
        Product.franchise_id == franchise_id,
        Product.is_active == True
    ).all()
    
    critical = [p for p in products if p.current_stock <= 0]
    low = [p for p in products if 0 < p.current_stock <= p.min_stock]
    ok = [p for p in products if p.current_stock > p.min_stock]
    
    summary = f"""
RESUMEN DE STOCK:
- Total productos: {len(products)}
- Stock crítico (sin stock): {len(critical)}
- Stock bajo: {len(low)}
- Stock OK: {len(ok)}

PRODUCTOS CRÍTICOS:
{chr(10).join([f"- {p.name} (stock: {p.current_stock})" for p in critical[:5]])}

PRODUCTOS CON STOCK BAJO:
{chr(10).join([f"- {p.name} (stock: {p.current_stock}, mínimo: {p.min_stock})" for p in low[:5]])}
"""
    return summary

def get_products_list(db: Session, franchise_id: int, category: str = None) -> str:
    query = db.query(Product).filter(
        Product.franchise_id == franchise_id,
        Product.is_active == True
    )
    
    if category:
        query = query.filter(Product.category == category)
    
    products = query.order_by(Product.name).limit(20).all()
    
    return chr(10).join([f"- {p.name}: {p.current_stock} unidades (mín: {p.min_stock})" for p in products])

@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    api_key = os.getenv("GOOGLE_API_KEY", "")
    
    if not api_key:
        return ChatResponse(
            response="El chatbot no está configurado. Agregá GOOGLE_API_KEY en las variables de entorno."
        )
    
    try:
        import google.generativeai as genai
        
        # Obtener contexto del negocio
        stock_summary = get_stock_summary(db, current_user.franchise_id)
        products_list = get_products_list(db, current_user.franchise_id)
        
        # Últimas facturas
        recent_invoices = db.query(Invoice).filter(
            Invoice.franchise_id == current_user.franchise_id
        ).order_by(Invoice.created_at.desc()).limit(3).all()
        
        invoices_info = ""
        for inv in recent_invoices:
            invoices_info += f"- Factura #{inv.number}: ${inv.total:.2f} ({inv.status})\n"
        
        # Crear prompt con contexto
        system_prompt = f"""Sos un asistente virtual de una franquicia Grido Helados en Lanús, Buenos Aires.
Tu dueño es {current_user.name}.

INFORMACIÓN DEL NEGOCIO:
{stock_summary}

ÚLTIMAS FACTURAS:
{invoices_info}

ALGUNOS PRODUCTOS:
{products_list}

INSTRUCCIONES:
- Respondé en español argentino, de forma amigable y concisa
- Si te preguntan por stock, usá la información de arriba
- Si te preguntan por productos específicos, buscá en la lista
- Si necesitás información que no tenés, decilo
- Sos útil para: consultar stock, alertas, recomendaciones de pedidos
- No inventes información, si no sabés algo, decilo"""

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        response = model.generate_content([
            {"role": "user", "parts": [system_prompt]},
            {"role": "model", "parts": ["Entendido, soy el asistente de Grido Lanús. ¿En qué puedo ayudarte?"]},
            {"role": "user", "parts": [request.message]}
        ])
        
        return ChatResponse(response=response.text)
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return ChatResponse(
            response=f"Error al procesar tu mensaje: {str(e)[:100]}"
        )

@router.get("/quick-actions")
def get_quick_actions():
    """Devuelve acciones rápidas sugeridas para el chatbot"""
    return {
        "actions": [
            {"label": "¿Qué productos están críticos?", "query": "¿Qué productos están con stock crítico?"},
            {"label": "¿Qué necesito pedir?", "query": "¿Qué productos debería pedir a Helacor?"},
            {"label": "Resumen de stock", "query": "Dame un resumen del stock actual"},
            {"label": "Productos más vendidos", "query": "¿Cuáles son los productos más importantes para tener en stock?"},
            {"label": "Estado del clima", "query": "¿Cómo está el clima hoy? ¿Me conviene tener más impulsivos?"},
            {"label": "Últimas facturas", "query": "¿Qué facturas procesamos últimamente?"},
        ]
    }
