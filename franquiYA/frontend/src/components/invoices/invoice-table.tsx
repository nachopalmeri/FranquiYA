'use client'

import { Check, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Invoice, Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { PriceBadge } from './price-badge'

interface InvoiceTableProps {
  invoice: Invoice | null
  products: Product[]
  onApproveLine: (lineId: number, productId?: number) => void
  onConfirm: () => void
  loading: boolean
}

export function InvoiceTable({ 
  invoice, 
  onApproveLine, 
  onConfirm,
  loading 
}: InvoiceTableProps) {
  if (!invoice) return null

  const pendingLines = invoice.lines.filter(l => !l.approved)
  const approvedLines = invoice.lines.filter(l => l.approved)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {invoice.status === 'confirmed' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            Factura #{invoice.number}
          </CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Fecha: {new Date(invoice.date).toLocaleDateString('es-AR')} • 
            Total: <span className="font-mono font-semibold">{formatPrice(invoice.total)}</span>
          </p>
        </div>
        {invoice.status === 'pending' && pendingLines.length === 0 && (
          <Button 
            onClick={onConfirm} 
            disabled={loading}
            className="bg-[#E31D2B] hover:bg-[#C41925]"
          >
            <Check className="mr-2 h-4 w-4" />
            Confirmar Ingreso al Stock
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[25%]">Origen (PDF)</TableHead>
                <TableHead className="w-[20%]">Match Sistema</TableHead>
                <TableHead className="w-[10%] text-right">Cantidad</TableHead>
                <TableHead className="w-[15%] text-right">P. Unitario</TableHead>
                <TableHead className="w-[15%] text-right">Análisis</TableHead>
                <TableHead className="w-[15%]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow 
                  key={line.id}
                  className={line.approved ? 'bg-emerald-50' : ''}
                >
                  <TableCell>
                    <p className="font-medium text-gray-900">{line.raw_name}</p>
                    <p className="text-xs text-gray-500">{line.unit}</p>
                  </TableCell>
                  <TableCell>
                    {line.is_matched ? (
                      <Badge variant="default" className="bg-emerald-600">
                        {line.matched_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        Sin match
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {line.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-mono font-medium">{formatPrice(line.unit_price)}</p>
                      {line.previous_price && (
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(line.previous_price)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {line.price_change_pct !== undefined && line.price_change_pct !== 0 && (
                      <PriceBadge change={line.price_change_pct} />
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-600 hover:bg-emerald-50"
                          onClick={() => onApproveLine(line.id)}
                          disabled={line.approved || loading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:bg-gray-50"
                          disabled={loading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {line.approved && (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                        <Check className="mr-1 h-3 w-3" />
                        Aprobado
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-500">Líneas aprobadas</p>
              <p className="text-lg font-semibold text-emerald-600">
                {approvedLines.length} / {invoice.lines.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total a ingresar</p>
              <p className="font-mono text-lg font-semibold">
                {formatPrice(invoice.total)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
