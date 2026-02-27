'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Employee, Role, ShiftCalendar } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Clock } from 'lucide-react'
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

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function ShiftsPage() {
  const [calendar, setCalendar] = useState<ShiftCalendar | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: '',
    role_id: '',
    day_of_week: '',
    start_time: '08:00',
    end_time: '16:00',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [calData, empData, roleData] = await Promise.all([
        api.shifts.calendar(),
        api.employees.list(),
        api.roles.list(),
      ])
      setCalendar(calData)
      setEmployees(empData)
      setRoles(roleData)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.shifts.create({
        employee_id: parseInt(formData.employee_id),
        role_id: parseInt(formData.role_id),
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_recurring: true,
      })
      setIsDialogOpen(false)
      setFormData({
        employee_id: '',
        role_id: '',
        day_of_week: '',
        start_time: '08:00',
        end_time: '16:00',
      })
      loadData()
    } catch (error) {
      console.error('Failed to create shift:', error)
    }
  }

  const handleDelete = async (shiftId: number) => {
    try {
      await api.shifts.delete(shiftId)
      loadData()
    } catch (error) {
      console.error('Failed to delete shift:', error)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Turnos Semanales</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E31D2B] hover:bg-[#C41925]">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Nuevo Turno</DialogTitle>
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
              <div>
                <Label className="text-gray-300">Día</Label>
                <Select
                  value={formData.day_of_week}
                  onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {DAYS.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Hora Inicio</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Hora Fin</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#E31D2B] hover:bg-[#C41925]">
                Crear Turno
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#1a1a1a] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Calendario de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="space-y-2">
                <div className="text-center font-medium text-white p-2 bg-white/5 rounded">
                  {day}
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {calendar?.schedule[dayIdx]?.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-2 rounded text-xs cursor-pointer hover:opacity-80 group relative"
                      style={{
                        backgroundColor: roles.find((r) => r.id === shift.role_id)?.color + '30',
                        borderLeft: `3px solid ${roles.find((r) => r.id === shift.role_id)?.color}`,
                      }}
                    >
                      <div className="font-medium text-white">{shift.employee_name}</div>
                      <div className="text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {shift.start_time} - {shift.end_time}
                      </div>
                      <button
                        onClick={() => handleDelete(shift.id)}
                        className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(!calendar?.schedule[dayIdx] || calendar.schedule[dayIdx].length === 0) && (
                    <div className="text-center text-gray-500 text-xs p-4 border border-dashed border-white/10 rounded">
                      Sin turnos
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
