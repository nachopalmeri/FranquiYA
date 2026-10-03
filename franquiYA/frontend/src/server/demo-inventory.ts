export type StockStatus = 'critical' | 'low' | 'ok'

export interface DemoProduct {
  id: number
  name: string
  category: string
  unit: string
  current_stock: number
  min_stock: number
  unit_price: number
  is_active: boolean
}

export interface ProductRepository {
  list(category?: string): DemoProduct[]
  get(id: number): DemoProduct | undefined
}

export class DemoInventoryRepository implements ProductRepository {
  private readonly products: DemoProduct[] = [
    { id: 1, name: 'Chocolate', category: 'sabor_7.8kg', unit: '7.8kg', current_stock: 0, min_stock: 5, unit_price: 24000, is_active: true },
    { id: 2, name: 'Dulce de leche', category: 'sabor_7.8kg', unit: '7.8kg', current_stock: 3, min_stock: 5, unit_price: 24000, is_active: true },
    { id: 3, name: 'Frutilla', category: 'sabor_7.8kg', unit: '7.8kg', current_stock: 12, min_stock: 5, unit_price: 24000, is_active: true },
    { id: 4, name: 'Bombón', category: 'bombones', unit: 'caja', current_stock: 2, min_stock: 4, unit_price: 18000, is_active: true },
    { id: 5, name: 'Palito frutal', category: 'palitos', unit: 'pack', current_stock: 18, min_stock: 6, unit_price: 8500, is_active: true },
    { id: 6, name: 'Torta helada', category: 'tortas', unit: 'unidad', current_stock: 0, min_stock: 2, unit_price: 16000, is_active: true },
  ]

  list(category?: string): DemoProduct[] {
    return this.products.filter((product) => product.is_active && (!category || product.category === category))
  }

  get(id: number): DemoProduct | undefined {
    return this.products.find((product) => product.id === id && product.is_active)
  }
}

export class InventoryService {
  constructor(private readonly products: ProductRepository) {}

  list(category?: string): DemoProduct[] {
    return this.products.list(category)
  }

  get(id: number): DemoProduct | undefined {
    return this.products.get(id)
  }

  status(product: DemoProduct): StockStatus {
    if (product.current_stock <= 0) return 'critical'
    if (product.current_stock <= product.min_stock) return 'low'
    return 'ok'
  }

  alerts() {
    return this.products.list()
      .map((product) => ({
        product,
        status: this.status(product),
        message: this.status(product) === 'critical'
          ? 'Sin stock - Reponer urgente'
          : `Stock bajo - Mínimo: ${product.min_stock}`,
      }))
      .filter((alert) => alert.status !== 'ok')
  }

  stats() {
    const products = this.products.list()
    return {
      total_products: products.length,
      low_stock_count: products.filter((product) => this.status(product) === 'low').length,
      critical_stock_count: products.filter((product) => this.status(product) === 'critical').length,
      pending_invoices: 0,
    }
  }
}

export const demoInventory = new InventoryService(new DemoInventoryRepository())
