'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/lib/types'
import { formatPrice, getStockStatus } from '@/lib/utils'

interface StockTableProps {
  products: Product[]
}

export function StockTable({ products }: StockTableProps) {
  const getStatusBadge = (product: Product) => {
    const status = getStockStatus(product)
    if (status === 'critical') {
      return <Badge className="bg-red-500 text-white">Crítico</Badge>
    }
    if (status === 'low') {
      return <Badge className="bg-amber-500 text-white">Bajo</Badge>
    }
    return <Badge className="bg-emerald-500 text-white">OK</Badge>
  }

  if (products.length === 0) {
    return (
      <Card className="border-border bg-secondary">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No se encontraron productos</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-secondary">
      <CardHeader>
        <CardTitle className="text-white">Lista de Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-gray-400">Producto</TableHead>
                <TableHead className="text-gray-400">Categoría</TableHead>
                <TableHead className="text-right text-gray-400">Stock</TableHead>
                <TableHead className="text-right text-gray-400">Mínimo</TableHead>
                <TableHead className="text-right text-gray-400">Precio</TableHead>
                <TableHead className="text-gray-400">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-border">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.unit}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-gray-300">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-white">
                    {product.current_stock}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-400">
                    {product.min_stock}
                  </TableCell>
                  <TableCell className="text-right font-mono text-white">
                    {formatPrice(product.unit_price)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(product)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
