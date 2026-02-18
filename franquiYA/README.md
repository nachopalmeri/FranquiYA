# Grido Smart Dashboard

## Contexto del Proyecto
Sistema de gestión de stock y operaciones para una franquicia de helados Grido.
El objetivo es digitalizar el control de stock (que actualmente es manual en Excel) y automatizar la carga de facturas PDF.

## Stack Tecnológico
- **Frontend:** React / Next.js + Tailwind CSS (Mobile First para auditorías).
- **Backend:** Python (FastAPI).
- **Base de Datos:** SQLite (local).
- **Integraciones:** - `pdfplumber` para leer facturas PDF de "Helacor S.A.".
  - OpenWeatherMap API para alertas de clima.

## Funcionalidades Clave
1. **Auditoría de Stock:** Interfaz móvil para contar baldes y cajas en la cámara de frío.
2. **Conciliación de Facturas:** Script que lee PDFs de facturas y actualiza el stock teórico.
3. **Predicción de Demanda:** Alertas basadas en el clima (Ola de calor / Lluvia).