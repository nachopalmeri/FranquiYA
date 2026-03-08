'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles, Bot, User as UserIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/layout/auth-provider'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export function ChatWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0 && user?.franchise_name) {
      setMessages([
        { 
          role: 'assistant', 
          content: `¡Hola! 👋 Soy el asistente de ${user.franchise_name}. ¿En qué puedo ayudarte hoy?\n\nPuedo darte información sobre:\n• Stock de productos\n• Productos críticos o con stock bajo\n• Resumen de tu negocio\n• Facturas recientes` 
        }
      ])
    }
  }, [isOpen, user?.franchise_name, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (messageText?: string) => {
    const text = messageText?.trim() || input.trim()
    if (!text || loading) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Update the last message with full response
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: data.response,
            streaming: false
          }
          return newMessages
        })
      } else {
        // Error response
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: 'Disculpa, tuve un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?',
            streaming: false
          }
          return newMessages
        })
      }
    } catch {
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'Error de conexión. Verificá tu internet e intentá de nuevo.',
          streaming: false
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Quick actions
  const quickActions = [
    "¿Qué productos están críticos?",
    "¿Qué debo pedir a Helacor?",
    "Resumen del stock",
    "Últimas facturas"
  ]

  return (
    <>
      {/* Floating Button - Vercel style */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#E31D2B] text-white shadow-lg shadow-red-500/25 hover:bg-[#C41925] hover:scale-105 transition-all duration-200"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window - Vercel AI style */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] max-h-[80vh] bg-[#171717] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E31D2B]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Asistente IA</h3>
                <p className="text-xs text-gray-400">Tu ayuda inteligente</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'user' ? 'bg-[#E31D2B]' : 'bg-[#2a2a2a]'
                  }`}>
                    {msg.role === 'user' ? (
                      <UserIcon className="h-3 w-3 text-white" />
                    ) : (
                      <Bot className="h-3 w-3 text-white" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#E31D2B] text-white rounded-br-md' 
                      : 'bg-[#2a2a2a] text-gray-100 rounded-bl-md'
                  }`}>
                    {msg.streaming && msg.content === '' ? (
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#2a2a2a] border border-white/10 text-gray-300 hover:bg-[#3a3a3a] hover:border-white/20 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-[#1f1f1f]">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribí tu consulta..."
                rows={1}
                className="flex-1 bg-[#2a2a2a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#E31D2B]/50 resize-none min-h-[44px] max-h-[120px]"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="h-11 w-11 p-0 bg-[#E31D2B] hover:bg-[#C41925] disabled:bg-[#2a2a2a]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              IA puede cometer errores. Verificá información importante.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
