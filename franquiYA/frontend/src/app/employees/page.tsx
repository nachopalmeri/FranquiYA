'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Employee, Role } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Phone, AlertCircle, Calendar } from 'lucide-react'
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role_id: '',
    phone: '',
    dni: '',
    emergency_contact: '',
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [empData, roleData] = await Promise.all([
        api.employees.list(),
        api.roles.list(),
      ])
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
      await api.employees.create({
        name: formData.name,
        role_id: parseInt(formData.role_id),
        phone: formData.phone || undefined,
        dni: formData.dni || undefined,
        emergency_contact: formData.emergency_contact || undefined,
      })
      setIsDialogOpen(false)
      setFormData({ name: '', role_id: '', phone: '', dni: '', emergency_contact: '' })
      loadData()
    } catch (error) {
      console.error('Failed to create employee:', error)
    }
  }

  if (loading) {
    return <div className="p-6 text-[#4A3728]">Cargando...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#4A3728] font-heading">Empleados</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E31D2B] hover:bg-[#C41925] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#E8DFD3]">
            <DialogHeader>
              <DialogTitle className="text-[#4A3728]">Nuevo Empleado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-[#4A3728]">Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-[#E8DFD3] bg-[#FFF8F0] text-[#4A3728]"
                  required
                />
              </div>
              <div>
                <Label className="text-[#4A3728]">Rol</Label>
                <Select
                  value={formData.role_id}
                  onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                >
                  <SelectTrigger className="border-[#E8DFD3] bg-[#FFF8F0] text-[#4A3728]">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E8DFD3]">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          {role.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#4A3728]">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-[#E8DFD3] bg-[#FFF8F0] text-[#4A3728]"
                />
              </div>
              <div>
                <Label className="text-[#4A3728]">DNI</Label>
                <Input
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="border-[#E8DFD3] bg-[#FFF8F0] text-[#4A3728]"
                />
              </div>
              <div>
                <Label className="text-[#4A3728]">Contacto de Emergencia</Label>
                <Input
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="border-[#E8DFD3] bg-[#FFF8F0] text-[#4A3728]"
                />
              </div>
              <Button type="submit" className="w-full bg-[#E31D2B] hover:bg-[#C41925] text-white">
                Crear Empleado
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp) => (
          <Card key={emp.id} className="bg-white border-[#E8DFD3] shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-[#4A3728] text-lg">{emp.name}</CardTitle>
                {emp.role && (
                  <Badge
                    style={{ backgroundColor: emp.role.color + '20', color: emp.role.color }}
                  >
                    {emp.role.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {emp.phone && (
                <div className="flex items-center gap-2 text-[#8B7355] text-sm">
                  <Phone className="h-4 w-4" />
                  {emp.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-[#8B7355] text-sm">
                <Calendar className="h-4 w-4" />
                Vacaciones: {emp.vacation_remaining || emp.vacation_days_total} días restantes
              </div>
              {(emp.vacation_taken || 0) > 0 && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {emp.vacation_taken} días tomados
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <Card className="bg-white border-[#E8DFD3]">
          <CardContent className="py-10 text-center text-[#8B7355]">
            No hay empleados registrados. ¡Agrega tu primer empleado!
          </CardContent>
        </Card>
      )}
    </div>
  )
}
