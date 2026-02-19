'use client'

import { Progress } from '@/components/ui/progress'

interface AuditProgressBarProps {
  current: number
  total: number
}

export function AuditProgressBar({ current, total }: AuditProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="sticky top-16 z-20 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm px-4 py-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">
            Progreso de Auditoría
          </span>
          <span className="font-mono text-sm font-semibold text-white">
            {current} / {total} productos
          </span>
        </div>
        <Progress 
          value={percentage} 
          className="h-2 bg-white/10"
        />
        <div className="mt-1 text-right">
          <span className="text-xs text-gray-500">{percentage}% completado</span>
        </div>
      </div>
    </div>
  )
}
