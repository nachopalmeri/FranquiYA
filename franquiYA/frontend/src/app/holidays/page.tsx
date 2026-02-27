'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Employee, Holiday } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    notes: '',
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [holData, empData] = await Promise.all([
        api.holidays.list(),
        api.employees.list(),
      ])
      setHolidays(holData)
      setEmployees(empData)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    try {
      await api.holidays.create({
        employee_id: parseInt(formData.employee_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_count: daysCount,
        notes: formData.notes || undefined,
        status: 'planned',
      })
      setIsDialogOpen(false)
      setFormData({ employee_id: '', start_date: '', end_date: '', notes: '' })
      loadData()
    } catch (error) {
      console.error('Failed to create holiday:', error)
    }
  }

  const handleStatusChange = async (id: number, status: 'planned' | 'approved' | 'taken' | 'cancelled') => {
    try {
      await api.holidays.update(id, { status })
      loadData()
    } catch (error) {
      console.error('Failed to update holiday:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500'
      case 'taken':
        return 'bg-blue-500'
      case 'planned':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getEmployeeName = (id: number) => {
    return employees.find((e) => e.id === id)?.name || 'Unknown'
  }

  if (loading) {
    return <div className="p-6 text-[#4A3728]">Cargando...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#4A3728] font-heading">Vacaciones</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E31D2B] hover:bg-[#C41925]">
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Vacaciones
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Solicitar Vacaciones</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Empleado</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Fecha Fin</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Notas</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Notas adicionales..."
                />
              </div>
              <Button type="submit" className="w-full bg-[#E31D2B] hover:bg-[#C41925]">
                Solicitar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {holidays.map((holiday) => (
          <Card key={holiday.id} className="bg-[#1a1a1a] border-white/10">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-white text-lg">
                  {getEmployeeName(holiday.employee_id)}
                </CardTitle>
                <Badge className={getStatusColor(holiday.status)}>
                  {holiday.status === 'planned'
                    ? 'Pendiente'
                    : holiday.status === 'approved'
                    ? 'Aprobado'
                    : 'Tomado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="h-4 w-4" />
                {holiday.start_date} - {holiday.end_date}
              </div>
              <div className="text-amber-400 text-sm font-medium">
                {holiday.days_count} días
              </div>
              {holiday.notes && (
                <div className="text-gray-500 text-sm">{holiday.notes}</div>
              )}
              {holiday.status === 'planned' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleStatusChange(holiday.id, 'approved')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(holiday.id, 'cancelled')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {holidays.length === 0 && (
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardContent className="py-10 text-center text-gray-400">
            No hay vacaciones registradas.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
