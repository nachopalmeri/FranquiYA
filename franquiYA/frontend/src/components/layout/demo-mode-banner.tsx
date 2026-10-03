'use client'

import { FlaskConical, LockKeyhole } from 'lucide-react'
import { useAuth } from '@/components/layout/auth-provider'

export function DemoModeBanner() {
  const { user } = useAuth()
  if (!user?.is_demo) return null

  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1"><strong>Demo mode:</strong> sample data only. Changes are disabled.</div>
      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    </div>
  )
}
