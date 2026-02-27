'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Task, TaskStats, Employee } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle, Circle, Clock, AlertTriangle, Check } from 'lucide-react'
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : undefined
      const [taskData, statsData, empData] = await Promise.all([
        api.tasks.list(params),
        api.tasks.stats(),
        api.employees.list(),
      ])
      setTasks(taskData)
      setStats(statsData)
      setEmployees(empData)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.tasks.create({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
      })
      setIsDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
      })
      loadData()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.tasks.update(id, { status })
      loadData()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.tasks.delete(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return <div className="p-6 text-[#4A3728]">Cargando...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#4A3728] font-heading">Tareas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E31D2B] hover:bg-[#C41925]">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Nueva Tarea</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Descripción</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Fecha Límite</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Asignar a</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    <SelectItem value="">Sin asignar</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-[#E31D2B] hover:bg-[#C41925]">
                Crear Tarea
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-gray-400 text-sm">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-gray-400 text-sm">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
              <div className="text-gray-400 text-sm">En Progreso</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-400">{stats.urgent}</div>
              <div className="text-gray-400 text-sm">Urgentes</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => { setFilter('all'); loadData(); }}
          className={filter === 'all' ? 'bg-[#E31D2B]' : 'border-white/10 text-gray-400'}
        >
          Todas
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => { setFilter('pending'); loadData(); }}
          className={filter === 'pending' ? 'bg-[#E31D2B]' : 'border-white/10 text-gray-400'}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === 'in_progress' ? 'default' : 'outline'}
          onClick={() => { setFilter('in_progress'); loadData(); }}
          className={filter === 'in_progress' ? 'bg-[#E31D2B]' : 'border-white/10 text-gray-400'}
        >
          En Progreso
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => { setFilter('completed'); loadData(); }}
          className={filter === 'completed' ? 'bg-[#E31D2B]' : 'border-white/10 text-gray-400'}
        >
          Completadas
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="bg-[#1a1a1a] border-white/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => handleStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}>
                  {getStatusIcon(task.status)}
                </button>
                <div className="flex-1">
                  <div className={`text-white font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-gray-500 text-sm">{task.description}</div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority === 'urgent' ? 'Urgente' : 
                       task.priority === 'high' ? 'Alta' :
                       task.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                    {task.due_date && (
                      <span className="text-gray-500 text-xs">{task.due_date}</span>
                    )}
                    {task.assignee && (
                      <span className="text-gray-500 text-xs">→ {task.assignee.name}</span>
                    )}
                  </div>
                </div>
                {task.status !== 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardContent className="py-10 text-center text-gray-400">
            No hay tareas. ¡Crea tu primera tarea!
          </CardContent>
        </Card>
      )}
    </div>
  )
}
