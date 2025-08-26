import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, X, Bot, User } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '¡Hola! Soy tu asistente IA. ¿En qué puedo ayudarte hoy?',
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = message.trim()
    setMessage("")
    setIsLoading(true)

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        message: currentMessage,
        source: "FROST Demo Chat",
        page: window.location.pathname,
        origin: window.location.origin,
        user_agent: navigator.userAgent,
        session_id: sessionId,
        conversation_history: messages.slice(-5) // Últimos 5 mensajes para contexto
      }

      const response = await fetch("https://shakams434.app.n8n.cloud/webhook/9c97ec55-93e7-4d52-9f4f-3e6263b46937", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.response || "Lo siento, no pude procesar tu mensaje."
        
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.",
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el agente IA.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
        </Button>
      ) : (
        <Card className="w-96 h-[500px] shadow-2xl flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Agente IA
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      {msg.sender === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
            </div>
            
            <div className="flex-shrink-0 p-4 border-t bg-background">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isLoading || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}