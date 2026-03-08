from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import logging
from database import get_db
from models.user import User
from models.product import Product
from models.invoice import Invoice
from models.franchise import Franchise
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
    # First, try to answer from local data without external API
    message_lower = request.message.lower()
    
    # Get franchise info
    franchise = db.query(Franchise).filter(Franchise.id == current_user.franchise_id).first()
    franchise_name = franchise.name if franchise else "Grido"
    franchise_city = franchise.city if franchise else "Buenos Aires"
    
    # Get stock summary
    products = db.query(Product).filter(
        Product.franchise_id == current_user.franchise_id,
        Product.is_active == True
    ).all()
    
    critical = [p for p in products if p.current_stock <= 0]
    low = [p for p in products if 0 < p.current_stock <= p.min_stock]
    ok = [p for p in products if p.current_stock > p.min_stock]
    
    # Try local responses first for simple queries
    if any(word in message_lower for word in ['resumen', 'resum', 'estado']):
        response_text = f"""📊 RESUMEN DE {franchise_name.upper()} ({franchise_city}):

• Total productos: {len(products)}
• ⛔ Stock crítico (sin stock): {len(critical)}
• ⚠️ Stock bajo: {len(low)}
• ✅ Stock OK: {len(ok)}

{'-' * 30}
PRODUCTOS SIN STOCK ({len(critical)}):
{chr(10).join([f"• {p.name}" for p in critical[:8]]) if critical else "✓ Ninguno"}

PRODUCTOS CON STOCK BAJO ({len(low)}):
{chr(10).join([f"• {p.name} ({p.current_stock}/{p.min_stock})" for p in low[:8]]) if low else "✓ Ninguno"}
"""
        return ChatResponse(response=response_text)
    
    if any(word in message_lower for word in ['critico', 'sin stock', 'sin stock', 'agotado']):
        if critical:
            response_text = "⛔ PRODUCTOS SIN STOCK:\n\n" + chr(10).join([
                f"• {p.name}" for p in critical[:15]
            ])
            if len(critical) > 15:
                response_text += f"\n...y {len(critical) - 15} más"
            return ChatResponse(response=response_text)
        else:
            return ChatResponse(response="✅ ¡Excelente! No tenés productos sin stock.")
    
    if any(word in message_lower for word in ['bajo', 'reponer', 'pedir']):
        if low:
            response_text = "⚠️ PRODUCTOS CON STOCK BAJO (deberías pedir):\n\n" + chr(10).join([
                f"• {p.name}: {p.current_stock} unidades (mínimo: {p.min_stock})" for p in low[:15]
            ])
            if len(low) > 15:
                response_text += f"\n\n...y {len(low) - 15} más"
            return ChatResponse(response=response_text)
        else:
            return ChatResponse(response="✅ Tenés todo el stock OK. No hace falta reponer.")
    
    if any(word in message_lower for word in ['producto', 'productos', 'helado', 'sabor']):
        # List products by category
        categories = {}
        for p in products:
            cat = p.category or 'Otros'
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(p)
        
        response_text = f"📦 LISTA DE PRODUCTOS ({len(products)} total):\n\n"
        for cat, prods in list(categories.items())[:5]:
            response_text += f"{cat.upper()}:\n"
            response_text += chr(10).join([f"  • {p.name}: {p.current_stock}" for p in prods[:5]]) + "\n\n"
        
        return ChatResponse(response=response_text)
    
    if any(word in message_lower for word in ['factura', 'facturas', 'última']):
        recent = db.query(Invoice).filter(
            Invoice.franchise_id == current_user.franchise_id
        ).order_by(Invoice.created_at.desc()).limit(5).all()
        
        if recent:
            response_text = "🧾 ÚLTIMAS FACTURAS:\n\n" + chr(10).join([
                f"• #{inv.number}: ${inv.total:,.2f} ({inv.status}) - {inv.created_at.strftime('%d/%m/%Y')}"
                for inv in recent
            ])
            return ChatResponse(response=response_text)
        else:
            return ChatResponse(response="No tenés facturas cargadas aún.")
    
    # If local query didn't match, try Groq API
    api_key = os.getenv("GROQ_API_KEY", "")
    
    if not api_key:
        return ChatResponse(
            response="🤖 Estoy operando en modo básico. ¿Querés preguntarme sobre:\n" +
            "• Resumen de stock\n" +
            "• Productos sin stock\n" +
            "• Productos con stock bajo\n" +
            "• Últimas facturas\n" +
            "• Lista de productos\n\n" +
            "PD: Configurá GROQ_API_KEY para respuestas más inteligentes."
        )
    
    try:
        from groq import Groq
        
        client = Groq(api_key=api_key)
        
        stock_summary = f"""
- Total: {len(products)} productos
- Críticos: {len(critical)}
- Stock bajo: {len(low)}
- OK: {len(ok)}
"""
        
        system_prompt = f"""Sos un asistente virtual de una franquicia Grido Helados en {franchise_city}.
La franquicia se llama "{franchise_name}". Tu dueño es {current_user.name}.

RESUMEN DE STOCK:
{stock_summary}

INSTRUCCIONES:
- Respondé en español argentino, forma amigable y concisa (máximo 3 oraciones para preguntas simples)
- Si te preguntan por stock, usá la información de arriba
- Dale importancia a productos críticos
- Recomendá pedir productos con stock bajo
- No inventes información"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        return ChatResponse(response=response.choices[0].message.content)
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        # Fallback response
        return ChatResponse(
            response=f"🤖 Estoy operando en modo básico.\n\n" +
            f"📊 Stock: {len(products)} productos | ⛔ {len(critical)} críticos | ⚠️ {len(low)} bajo\n\n" +
            "Probá preguntando:\n" +
            "• '¿Qué productos están críticos?'\n" +
            "• '¿Qué debo pedir?'\n" +
            "• 'Resumen de stock'"
        )
    
    try:
        from groq import Groq
        
        client = Groq(api_key=api_key)
        
        franchise = db.query(Franchise).filter(Franchise.id == current_user.franchise_id).first()
        franchise_name = franchise.name if franchise else "Grido"
        franchise_city = franchise.city if franchise else "Buenos Aires"
        
        stock_summary = get_stock_summary(db, current_user.franchise_id)
        products_list = get_products_list(db, current_user.franchise_id)
        
        recent_invoices = db.query(Invoice).filter(
            Invoice.franchise_id == current_user.franchise_id
        ).order_by(Invoice.created_at.desc()).limit(3).all()
        
        invoices_info = ""
        for inv in recent_invoices:
            invoices_info += f"- Factura #{inv.number}: ${inv.total:.2f} ({inv.status})\n"
        
        system_prompt = f"""Sos un asistente virtual de una franquicia Grido Helados en {franchise_city}, Buenos Aires.
Tu dueño es {current_user.name}.
La franquicia se llama "{franchise_name}".

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

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return ChatResponse(response=response.choices[0].message.content)
        
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
