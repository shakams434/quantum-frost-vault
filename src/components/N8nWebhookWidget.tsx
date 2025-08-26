import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Send, MessageSquare, Loader2 } from "lucide-react"

interface N8nWebhookWidgetProps {
  webhookUrl?: string
}

export default function N8nWebhookWidget({ 
  webhookUrl = "https://shakams434.app.n8n.cloud/webhook-test/9c97ec55-93e7-4d52-9f4f-3e6263b46937" 
}: N8nWebhookWidgetProps) {
  const [message, setMessage] = useState("")
  const [userEmail, setUserEmail] = useState("")
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
    console.log("Enviando mensaje a n8n webhook:", webhookUrl)

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        message: message.trim(),
        userEmail: userEmail.trim() || "usuario@demo.com",
        source: "FROST Demo",
        page: window.location.pathname,
        origin: window.location.origin,
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(payload),
      })

      toast({
        title: "Mensaje Enviado",
        description: "Tu mensaje fue enviado a n8n. Revisa el historial de tu workflow para confirmar que se recibió.",
      })

      // Limpiar el formulario
      setMessage("")
      setUserEmail("")
    } catch (error) {
      console.error("Error enviando mensaje:", error)
      toast({
        title: "Error",
        description: "Error al enviar el mensaje. Verifica la URL del webhook e intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Enviar Mensaje a n8n
        </CardTitle>
        <CardDescription>
          Envía un mensaje directamente a tu workflow de n8n
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label htmlFor="userEmail" className="text-sm font-medium">
              Email (opcional)
            </label>
            <Input
              id="userEmail"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="tu@email.com"
              className="mt-1"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="text-sm font-medium">
              Mensaje *
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="mt-1 min-h-[100px]"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

        <div className="mt-4 text-xs text-muted-foreground">
          <p><strong>Webhook URL:</strong> {webhookUrl}</p>
          <p className="mt-1">El payload incluye: timestamp, mensaje, email, página actual y origen.</p>
        </div>
      </CardContent>
    </Card>
  )
}