# Grido Smart Ops

Sistema de gestión integral para franquicias de helados Grido.

## Características

- **Dashboard Inteligente**: KPIs de stock, alertas climáticas con predicción de demanda
- **Conciliación de Facturas**: Procesamiento automático de PDFs de Helacor S.A.
- **Auditoría Móvil**: Interfaz mobile-first para conteo en cámara de frío
- **Sistema de Autenticación**: JWT con roles (admin/operator)

## Stack Tecnológico

- **Frontend**: Next.js 14 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + SQLAlchemy
- **Base de Datos**: SQLite
- **Integraciones**: OpenWeatherMap API, pdfplumber

## Inicio Rápido

### Backend

```bash
cd franquiYA/backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd franquiYA/frontend
npm install
npm run dev
```

### Credenciales Demo

- **Admin**: admin@grido.com / admin123
- **Operator**: operator@grido.com / operator123

## Estructura del Proyecto

```
franquiYA/
├── frontend/           # Next.js 14 App
│   ├── src/
│   │   ├── app/        # Páginas (Dashboard, Invoices, Audit)
│   │   ├── components/ # Componentes React
│   │   └── lib/        # Utils, API, Types
│   └── package.json
│
├── backend/            # FastAPI API
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── routers/        # API endpoints
│   ├── services/       # Business logic
│   └── main.py
│
└── README.md
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/weather | Clima actual |
| GET | /api/stock | Lista productos |
| GET | /api/stock/alerts | Alertas de stock |
| POST | /api/invoices/upload | Subir PDF |
| POST | /api/invoices/{id}/confirm | Confirmar factura |
| GET | /api/audit/products | Productos para auditoría |

## Variables de Entorno

```bash
# backend/.env
DATABASE_URL=sqlite:///./grido.db
SECRET_KEY=tu-clave-secreta
OPENWEATHERMAP_API_KEY=tu-api-key
WEATHER_CITY=Lanus,AR
```

## Licencia

Privado - Franquicia Grido Lanús
