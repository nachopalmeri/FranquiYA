from fastapi import FastAPI, UploadFile, File
import pdfplumber

app = FastAPI(title="Grido Dashboard API")

@app.get("/")
def read_root():
    return {"status": "Sistema Operativo", "franchise": "Grido Lanús"}

@app.post("/upload-invoice/")
async def upload_invoice(file: UploadFile = File(...)):
    # Aquí implementaremos la lógica de lectura del PDF
    return {"filename": file.filename, "status": "Recibido"}