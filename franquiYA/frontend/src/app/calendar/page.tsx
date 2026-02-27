'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { ExternalEvent } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, User, Clock, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CalendarPage() {
  const [events, setEvents] = useState<ExternalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    visitor_name: '',
    visitor_contact: '',
    date: '',
    time_start: '',
    time_end: '',
    description: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await api.externalEvents.list()
      setEvents(data)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.externalEvents.create({
        title: formData.title,
        visitor_name: formData.visitor_name,
        visitor_contact: formData.visitor_contact || undefined,
        date: formData.date,
        time_start: formData.time_start || undefined,
        time_end: formData.time_end || undefined,
        description: formData.description || undefined,
        is_recurring: false,
      })
      setIsDialogOpen(false)
      setFormData({
        title: '',
        visitor_name: '',
        visitor_contact: '',
        date: '',
        time_start: '',
        time_end: '',
        description: '',
      })
      loadData()
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.externalEvents.update(id, { status })
      loadData()
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programado'
      case 'completed':
        return 'Completado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const groupedEvents = events.reduce((acc, event) => {
    const month = event.date.substring(0, 7)
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {} as Record<string, ExternalEvent[]>)

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Calendario de Eventos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E31D2B] hover:bg-[#C41925]">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Nuevo Evento Externo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Ej: Arquitecto - Visita de obra"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Nombre del Visitante</Label>
                <Input
                  value={formData.visitor_name}
                  onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Contacto</Label>
                <Input
                  value={formData.visitor_contact}
                  onChange={(e) => setFormData({ ...formData, visitor_contact: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Teléfono o email"
                />
              </div>
              <div>
                <Label className="text-gray-300">Fecha</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Hora Inicio</Label>
                  <Input
                    type="time"
                    value={formData.time_start}
                    onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Hora Fin</Label>
                  <Input
                    type="time"
                    value={formData.time_end}
                    onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Descripción</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Notas adicionales..."
                />
              </div>
              <Button type="submit" className="w-full bg-[#E31D2B] hover:bg-[#C41925]">
                Crear Evento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(groupedEvents).map(([month, monthEvents]) => (
        <div key={month}>
          <h2 className="text-lg font-semibold text-white mb-4">
            {new Date(month + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monthEvents.map((event) => (
              <Card key={event.id} className="bg-[#1a1a1a] border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white text-lg">{event.title}</CardTitle>
                    <Badge className={getStatusColor(event.status)}>
                      {formatStatus(event.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <User className="h-4 w-4" />
                    {event.visitor_name}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="h-4 w-4" />
                    {event.date}
                  </div>
                  {(event.time_start || event.time_end) && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="h-4 w-4" />
                      {event.time_start || '--:--'} - {event.time_end || '--:--'}
                    </div>
                  )}
                  {event.description && (
                    <div className="text-gray-500 text-sm">{event.description}</div>
                  )}
                  {event.status === 'scheduled' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleStatusChange(event.id, 'completed')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange(event.id, 'cancelled')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardContent className="py-10 text-center text-gray-400">
            No hay eventos externos programados.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
