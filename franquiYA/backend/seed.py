from models.user import User
from models.franchise import Franchise
from models.product import Product
from auth import get_password_hash

PRODUCTS_DATA = [
    ("Limón al Agua", "sabor_7.8kg", "7.8kg", 2, 5, 13014.28),
    ("Maracuyá al Agua", "sabor_7.8kg", "7.8kg", 3, 5, 13014.28),
    ("Frutilla al Agua", "sabor_7.8kg", "7.8kg", 2, 5, 13014.28),
    ("Frutos Rojos al Agua", "sabor_7.8kg", "7.8kg", 2, 5, 13014.28),
    ("Naranja", "sabor_7.8kg", "7.8kg", 2, 5, 13014.28),
    ("Marroc", "sabor_7.8kg", "7.8kg", 6, 5, 26820.81),
    ("Dulce de Leche Granizado", "sabor_7.8kg", "7.8kg", 10, 5, 24545.06),
    ("Dulce de Leche", "sabor_7.8kg", "7.8kg", 7, 5, 24545.06),
    ("Dulce de Leche con Nuez", "sabor_7.8kg", "7.8kg", 2, 5, 28706.56),
    ("Dulce de Leche con Brownie", "sabor_7.8kg", "7.8kg", 2, 5, 28706.56),
    ("Super Dulce de Leche", "sabor_7.8kg", "7.8kg", 5, 5, 24545.06),
    ("Granizado", "sabor_7.8kg", "7.8kg", 3, 5, 24545.06),
    ("Cappuccino Granizado", "sabor_7.8kg", "7.8kg", 3, 5, 26820.81),
    ("Crema Cookie", "sabor_7.8kg", "7.8kg", 3, 5, 24545.06),
    ("Menta Granizada", "sabor_7.8kg", "7.8kg", 5, 5, 24545.06),
    ("Banana con Dulce de Leche", "sabor_7.8kg", "7.8kg", 8, 5, 24545.06),
    ("Crema Flan", "sabor_7.8kg", "7.8kg", 5, 5, 24545.06),
    ("Crema Americana", "sabor_7.8kg", "7.8kg", 7, 5, 24545.06),
    ("Chocolate", "sabor_7.8kg", "7.8kg", 9, 5, 24545.06),
    ("Chocolate Suizo", "sabor_7.8kg", "7.8kg", 7, 5, 26820.81),
    ("Chocolate con Almendras", "sabor_7.8kg", "7.8kg", 7, 5, 28706.56),
    ("Choco Blanco Oreo", "sabor_7.8kg", "7.8kg", 2, 5, 28706.56),
    ("Chocolate Blanco", "sabor_7.8kg", "7.8kg", 2, 5, 24545.06),
    ("Chocolate Dubai", "sabor_7.8kg", "7.8kg", 5, 5, 26820.81),
    ("Chocolate Maní Crunch", "sabor_7.8kg", "7.8kg", 2, 5, 24545.06),
    ("Frutilla a la Crema", "sabor_7.8kg", "7.8kg", 10, 5, 24545.06),
    ("Durazno a la Crema", "sabor_7.8kg", "7.8kg", 3, 5, 24545.06),
    ("Ananá a la Crema", "sabor_7.8kg", "7.8kg", 3, 5, 24545.06),
    ("Cereza", "sabor_7.8kg", "7.8kg", 3, 5, 24545.06),
    ("Quinotos al Whisky", "sabor_7.8kg", "7.8kg", 3, 5, 26820.81),
    ("Mascarpone con Frutos del Bosque", "sabor_7.8kg", "7.8kg", 3, 5, 26820.81),
    ("Sambayón", "sabor_7.8kg", "7.8kg", 3, 5, 28706.56),
    ("Tiramisú", "sabor_7.8kg", "7.8kg", 2, 5, 26820.81),
    ("Tramontana", "sabor_7.8kg", "7.8kg", 7, 5, 26820.81),
    ("Crema Rusa", "sabor_7.8kg", "7.8kg", 3, 5, 24545.06),
    ("Vainilla", "sabor_7.8kg", "7.8kg", 4, 5, 24545.06),
    ("Super Gridito", "sabor_7.8kg", "7.8kg", 4, 5, 24545.06),
    ("Mango", "sabor_7.8kg", "7.8kg", 0, 5, 24545.06),
    ("Dubai", "sabor_7.8kg", "7.8kg", 5, 5, 26820.81),
    ("Secreto", "bombones", "caja", 16, 10, 0),
    ("Bombones Escocés", "bombones", "caja", 38, 10, 0),
    ("Casata", "bombones", "caja", 8, 8, 0),
    ("Almendrado", "bombones", "caja", 8, 8, 0),
    ("Delicia", "bombones", "caja", 4, 4, 0),
    ("Crocantino", "bombones", "caja", 16, 10, 0),
    ("Suizo", "bombones", "caja", 8, 8, 0),
    ("Frutezza", "bombones", "caja", 4, 4, 0),
    ("Crocante", "bombones", "caja", 15, 10, 0),
    ("Nesquik", "bombones", "caja", 0, 8, 0),
    ("Palito Limón", "palitos", "caja 24u", 7, 5, 0),
    ("Palito Frutilla", "palitos", "caja 24u", 32, 10, 0),
    ("Palito Naranja", "palitos", "caja 24u", 8, 5, 0),
    ("Palito Bombón", "palitos", "caja 24u", 25, 10, 0),
    ("Palito Americana", "palitos", "caja 24u", 8, 5, 0),
    ("Palito Crem. Frutilla", "palitos", "caja 24u", 8, 5, 0),
    ("Torta Frutilla", "tortas", "unidad", 11, 5, 0),
    ("Torta Oreo", "tortas", "unidad", 1, 2, 0),
    ("Torta Grido", "tortas", "unidad", 0, 2, 0),
    ("Tentación Frutilla", "tentaciones", "caja", 5, 5, 0),
    ("Tentación DDL Granizado", "tentaciones", "caja", 6, 5, 0),
    ("Tentación DDL", "tentaciones", "caja", 4, 5, 0),
    ("Tentación Chocolate", "tentaciones", "caja", 5, 5, 0),
    ("Tentación Menta", "tentaciones", "caja", 3, 3, 0),
    ("Tentación Vainilla", "tentaciones", "caja", 4, 5, 0),
    ("Tentación Granizado", "tentaciones", "caja", 3, 3, 0),
    ("Tentación Toddy", "tentaciones", "caja", 6, 5, 0),
    ("Tentación Americana", "tentaciones", "caja", 5, 5, 0),
    ("Tentación Cookie", "tentaciones", "caja", 3, 3, 0),
    ("Tentación Choco Almendras", "tentaciones", "caja", 5, 5, 0),
    ("Tentación Limón", "tentaciones", "caja", 5, 5, 0),
    ("Familiar N1", "familiares", "3lt", 2, 2, 32464.94),
    ("Familiar N2", "familiares", "3lt", 0, 2, 32464.94),
    ("Familiar N4", "familiares", "3lt", 0, 2, 32464.94),
    ("Familiar Sin Azúcar DDL", "familiares", "3lt", 6, 3, 32464.94),
    ("Familiar Sin Azúcar Chocolate", "familiares", "3lt", 0, 2, 32464.94),
    ("Familiar Sin Azúcar Frutilla", "familiares", "3lt", 0, 2, 32464.94),
    ("Vegano Maní", "familiares", "unidad", 2, 2, 0),
    ("Vegano Chocolate", "familiares", "unidad", 1, 2, 0),
    ("Vegano Vainilla", "familiares", "unidad", 0, 2, 0),
    ("Frizzio Cebolla", "congelados", "pack", 1, 2, 0),
    ("Frizzio Mini Pizza", "congelados", "pack", 0, 2, 0),
    ("Frizzio Muzza", "congelados", "pack", 2, 2, 0),
    ("Frizzio Casera", "congelados", "pack", 3, 2, 0),
    ("Frizzio Pechuguitas", "congelados", "pack", 2, 2, 0),
    ("Frizzio Muzarrelitas", "congelados", "pack", 2, 2, 0),
    ("Frizzio Muzzarella y Jamón", "congelados", "pack", 4, 2, 0),
    ("Frizzio Empanadas Carne", "congelados", "pack", 1, 2, 0),
    ("Frizzio Empanadas JyQ", "congelados", "pack", 1, 2, 0),
    ("Frambuesas Congeladas", "congelados", "pack", 5, 3, 0),
    ("Frutillas Congeladas", "congelados", "pack", 2, 2, 0),
    ("Smoothie Blue Sunset", "smoothies", "unidad", 1, 2, 0),
    ("Smoothie Mango", "smoothies", "unidad", 1, 2, 0),
    ("Sundae Shot", "insumos", "pack", 1, 1, 0),
]

def seed_database(db):
    existing_franchise = db.query(Franchise).filter(Franchise.code == "101535").first()
    if existing_franchise:
        return
    
    franchise = Franchise(
        code="101535",
        name="Grido Lanús",
        owner="Fernando Palmeri",
        cuit="20-2306063-67",
        address="9 de Julio 1720",
        city="Lanús",
        province="Buenos Aires",
        weather_city="Lanus,AR",
        supplier="Helacor S.A."
    )
    db.add(franchise)
    db.flush()
    
    admin_user = User(
        email="admin@grido.com",
        name="Fernando Palmeri",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        franchise_id=franchise.id,
        is_active=True
    )
    db.add(admin_user)
    
    operator_user = User(
        email="operator@grido.com",
        name="Operador",
        hashed_password=get_password_hash("operator123"),
        role="operator",
        franchise_id=franchise.id,
        is_active=True
    )
    db.add(operator_user)
    
    for name, category, unit, stock, min_stock, price in PRODUCTS_DATA:
        product = Product(
            name=name,
            category=category,
            unit=unit,
            current_stock=stock,
            min_stock=min_stock,
            unit_price=price,
            franchise_id=franchise.id,
            is_active=True
        )
        db.add(product)
    
    db.commit()
    print("Database seeded successfully!")
