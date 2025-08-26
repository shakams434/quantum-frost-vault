import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, X, Minimize2 } from "lucide-react"

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un mensaje",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        message: message.trim(),
        source: "FROST Demo Chat",
        page: window.location.pathname,
        origin: window.location.origin,
        user_agent: navigator.userAgent,
        session_id: crypto.randomUUID()
      }

      const response = await fetch("https://shakams434.app.n8n.cloud/webhook/9c97ec55-93e7-4d52-9f4f-3e6263b46937", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Mensaje Enviado",
          description: "Tu mensaje fue enviado correctamente al agente IA.",
        })
        setMessage("")
      } else {
        throw new Error('Error en la respuesta')
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error)
      toast({
        title: "Error",
        description: "Error al enviar el mensaje. Intenta de nuevo.",
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
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-80 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat con IA
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
          <CardContent className="space-y-4">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje para el agente IA..."
                className="min-h-[80px] resize-none"
                disabled={isLoading}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </form>
            
            <div className="text-xs text-muted-foreground">
              <p>💬 Conectado con agente IA</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}