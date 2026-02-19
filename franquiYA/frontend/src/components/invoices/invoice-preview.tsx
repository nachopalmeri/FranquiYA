'use client'

import { Check, X, AlertCircle, CheckCircle2, Package, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Invoice, InvoiceLine } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { PriceBadge } from './price-badge'
import { cn } from '@/lib/utils'

interface InvoicePreviewProps {
  invoice: Invoice
  onApproveLine: (lineId: number, productId?: number) => void
  onApproveAll: () => void
  onConfirm: () => void
  onClear: () => void
  loading: boolean
}

export function InvoicePreview({ 
  invoice, 
  onApproveLine, 
  onApproveAll,
  onConfirm,
  onClear,
  loading 
}: InvoicePreviewProps) {
  const matchedLines = invoice.lines.filter(l => l.is_matched)
  const unmatchedLines = invoice.lines.filter(l => !l.is_matched)
  const approvedLines = invoice.lines.filter(l => l.approved)
  const pendingLines = invoice.lines.filter(l => !l.approved)
  const matchedNotApproved = matchedLines.filter(l => !l.approved)

  const totalQuantity = invoice.lines.reduce((sum, l) => sum + l.quantity, 0)
  const approvedQuantity = approvedLines.reduce((sum, l) => sum + l.quantity, 0)

  const isConfirmed = invoice.status === 'confirmed'

  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-[#1a1a1a] overflow-hidden">
        <div className={cn(
          "h-1 w-full",
          isConfirmed ? "bg-emerald-500" : "bg-gradient-to-r from-[#E31D2B] via-[#ff4757] to-[#E31D2B]"
        )} />
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                {isConfirmed ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                  </div>
                )}
                <div>
                  <span>Factura #{invoice.number}</span>
                  <p className="text-sm font-normal text-gray-400 mt-1">
                    {invoice.supplier} • {new Date(invoice.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </CardTitle>
            </div>
            
            {!isConfirmed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isConfirmed ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Factura Confirmada</h3>
              <p className="text-gray-400">El stock fue actualizado correctamente</p>
              <div className="mt-4 grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div>
                  <p className="text-2xl font-bold text-white">{approvedLines.length}</p>
                  <p className="text-xs text-gray-400">Productos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{approvedQuantity}</p>
                  <p className="text-xs text-gray-400">Unidades</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{formatPrice(invoice.total)}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-400">Productos</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{invoice.lines.length}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-gray-400">Con match</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{matchedLines.length}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-gray-400">Sin match</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">{unmatchedLines.length}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4-[#E31D2B]" />
                    <span className="text-xs text-gray-400">Total</span>
                  </div>
                  <p className="text-xl font-bold text-white">{formatPrice(invoice.total)}</p>
                </div>
              </div>

              {matchedNotApproved.length > 0 && (
                <div className="rounded-xl bg-[#E31D2B]/10 border border-[#E31D2B]/30 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      {matchedNotApproved.length} productos con match listos para aprobar
                    </p>
                    <p className="text-sm text-gray-400">
                      Aprobá todos automáticamente o revisá uno por uno
                    </p>
                  </div>
                  <Button
                    onClick={onApproveAll}
                    disabled={loading}
                    className="bg-[#E31D2B] hover:bg-[#C41925] shadow-lg shadow-[#E31D2B]/30"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Aprobar todos
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Detalle de productos
                </h3>
                
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 bg-white/5 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <div className="col-span-4">Producto</div>
                    <div className="col-span-2 text-center">Match</div>
                    <div className="col-span-1 text-right">Cant.</div>
                    <div className="col-span-2 text-right">Precio</div>
                    <div className="col-span-1 text-right">Var.</div>
                    <div className="col-span-2 text-center">Estado</div>
                  </div>
                  
                  <div className="divide-y divide-white/5">
                    {invoice.lines.map((line) => (
                      <LineRow
                        key={line.id}
                        line={line}
                        isConfirmed={isConfirmed}
                        onApprove={onApproveLine}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Aprobados</p>
                    <p className="text-lg font-semibold text-white">
                      {approvedLines.length} / {invoice.lines.length}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Unidades</p>
                    <p className="text-lg font-semibold text-white">{totalQuantity}</p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total factura</p>
                    <p className="text-lg font-semibold text-[#E31D2B]">{formatPrice(invoice.total)}</p>
                  </div>
                </div>
                
                {pendingLines.length === 0 ? (
                  <Button
                    onClick={onConfirm}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Confirmar Ingreso al Stock
                  </Button>
                ) : (
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      Faltan aprobar <span className="text-amber-400 font-semibold">{pendingLines.length}</span> líneas
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {unmatchedLines.length > 0 && !isConfirmed && (
        <Card className="border border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
              <AlertCircle className="h-5 w-5" />
              Productos sin match automático
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-3">
              Estos productos no se encontraron en tu catálogo. Podés aprobarlos manualmente o agregarlos al sistema.
            </p>
            <div className="flex flex-wrap gap-2">
              {unmatchedLines.map((line) => (
                <Badge 
                  key={line.id} 
                  variant="outline" 
                  className="border-amber-500/30 text-amber-300"
                >
                  {line.raw_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LineRow({ 
  line, 
  isConfirmed, 
  onApprove, 
  loading 
}: { 
  line: InvoiceLine
  isConfirmed: boolean
  onApprove: (lineId: number) => void
  loading: boolean
}) {
  return (
    <div className={cn(
      "grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors",
      line.approved && "bg-emerald-500/5"
    )}>
      <div className="col-span-4">
        <p className="text-sm font-medium text-white truncate">{line.raw_name}</p>
        {line.is_matched && (
          <p className="text-xs text-gray-500">{line.matched_name}</p>
        )}
      </div>
      
      <div className="col-span-2 text-center">
        {line.is_matched ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
            Match
          </Badge>
        ) : (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
            Sin match
          </Badge>
        )}
      </div>
      
      <div className="col-span-1 text-right">
        <span className="font-mono text-white">{line.quantity}</span>
      </div>
      
      <div className="col-span-2 text-right">
        <p className="font-mono text-white">{formatPrice(line.unit_price)}</p>
        {line.previous_price && line.previous_price > 0 && (
          <p className="text-xs text-gray-500 line-through">{formatPrice(line.previous_price)}</p>
        )}
      </div>
      
      <div className="col-span-1 text-right">
        {line.price_change_pct !== undefined && line.price_change_pct !== 0 && (
          <PriceBadge change={line.price_change_pct} />
        )}
      </div>
      
      <div className="col-span-2 flex justify-center">
        {isConfirmed ? (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
            <Check className="mr-1 h-3 w-3" />
            Procesado
          </Badge>
        ) : line.approved ? (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
            <Check className="mr-1 h-3 w-3" />
            Aprobado
          </Badge>
        ) : line.is_matched ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onApprove(line.id)}
            disabled={loading}
            className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Check className="h-4 w-4" />
          </Button>
        ) : (
          <span className="text-xs text-gray-500">Manual</span>
        )}
      </div>
    </div>
  )
}
