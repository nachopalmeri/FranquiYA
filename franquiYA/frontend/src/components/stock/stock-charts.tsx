'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Product } from '@/lib/types'

interface StockChartsProps {
  products: Product[]
}

const CATEGORY_LABELS: Record<string, string> = {
  'sabor_7.8kg': 'Sabores 7.8kg',
  'sabor_1lt': 'Sabores 1lt',
  'bombones': 'Bombones',
  'palitos': 'Palitos',
  'tortas': 'Tortas',
  'tentaciones': 'Tentaciones',
  'familiares': 'Familiares',
  'congelados': 'Congelados',
  'smoothies': 'Smoothies',
  'insumos': 'Insumos',
}

export function StockCharts({ products }: StockChartsProps) {
  const categoryData = products.reduce((acc, product) => {
    const category = product.category
    if (!acc[category]) {
      acc[category] = { name: CATEGORY_LABELS[category] || category, stock: 0, count: 0 }
    }
    acc[category].stock += product.current_stock
    acc[category].count += 1
    return acc
  }, {} as Record<string, { name: string; stock: number; count: number }>)

  const barData = Object.values(categoryData).sort((a, b) => b.stock - a.stock)

  const statusData = [
    { name: 'Crítico', value: products.filter(p => p.current_stock <= 0).length, fill: '#EF4444' },
    { name: 'Bajo', value: products.filter(p => p.current_stock > 0 && p.current_stock <= p.min_stock).length, fill: '#F59E0B' },
    { name: 'OK', value: products.filter(p => p.current_stock > p.min_stock).length, fill: '#10B981' },
  ]

  return (
    <div className="space-y-4">
      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base text-white">Stock por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#666" />
                <YAxis dataKey="name" type="category" width={100} fontSize={12} stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                />
                <Bar dataKey="stock" fill="#E31D2B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base text-white">Estado del Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-sm text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base text-white">Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total productos</span>
              <span className="font-semibold text-white">{products.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Stock total</span>
              <span className="font-semibold text-white">{products.reduce((sum, p) => sum + p.current_stock, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Valor total</span>
              <span className="font-semibold text-white">
                {products.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
