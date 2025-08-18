import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Shield, Key, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface Participant {
  id: string
  name: string
  status: "idle" | "committed" | "signed"
  share: string
  commitment?: string
  signature?: string
}

interface Transaction {
  hash: string
  amount: string
  recipient: string
  timestamp: string
}

export default function FROST() {
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "A",
      name: "Participante A",
      status: "idle",
      share: "share_A_3f8e9d2a1b..."
    },
    {
      id: "B", 
      name: "Participante B",
      status: "idle",
      share: "share_B_7c2b5f1e8d..."
    },
    {
      id: "C",
      name: "Participante C", 
      status: "idle",
      share: "share_C_9a6d2c8f4b..."
    }
  ])

  const [transaction, setTransaction] = useState<Transaction>({
    hash: "0xa1b2c3d4e5f6...",
    amount: "1000.00 EUR",
    recipient: "did:demo:recipient:xyz",
    timestamp: new Date().toISOString()
  })

  const [signatureLatency, setSignatureLatency] = useState<number | null>(null)
  const [aggregatedSignature, setAggregatedSignature] = useState<string | null>(null)
  const [transactionSigned, setTransactionSigned] = useState(false)

  const commitParticipant = (participantId: string) => {
    const startTime = performance.now()
    
    setParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { 
            ...p, 
            status: "committed",
            commitment: `commit_${participantId}_${Math.random().toString(36).substr(2, 8)}`
          }
        : p
    ))

    // Show insufficient threshold message
    setTimeout(() => {
      const endTime = performance.now()
      setSignatureLatency(Number((endTime - startTime).toFixed(2)))
    }, 500)
  }

  const signWithParticipants = (participantIds: string[]) => {
    if (participantIds.length < 2) {
      alert("Se necesitan al menos 2 participantes para firmar (esquema 2-de-3)")
      return
    }

    const startTime = performance.now()

    // Update participants to signed status
    setParticipants(prev => prev.map(p => 
      participantIds.includes(p.id)
        ? { 
            ...p, 
            status: "signed",
            commitment: `commit_${p.id}_${Math.random().toString(36).substr(2, 8)}`,
            signature: `sig_${p.id}_${Math.random().toString(36).substr(2, 16)}`
          }
        : p
    ))

    // Simulate signature aggregation
    setTimeout(() => {
      const endTime = performance.now()
      const latency = Number((endTime - startTime).toFixed(2))
      setSignatureLatency(latency)
      
      // Generate aggregated signature
      const aggSig = `frost_sig_${Math.random().toString(36).substr(2, 32)}`
      setAggregatedSignature(aggSig)
      setTransactionSigned(true)
    }, 1200)
  }

  const resetDemo = () => {
    setParticipants(prev => prev.map(p => ({
      ...p,
      status: "idle",
      commitment: undefined,
      signature: undefined
    })))
    setSignatureLatency(null)
    setAggregatedSignature(null)
    setTransactionSigned(false)
  }

  const getParticipantVariant = (status: string) => {
    switch (status) {
      case "committed": return "secondary"
      case "signed": return "default"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "committed": return <Clock className="h-4 w-4" />
      case "signed": return <CheckCircle className="h-4 w-4" />
      default: return <Key className="h-4 w-4" />
    }
  }

  const activeParticipants = participants.filter(p => p.status !== "idle")
  const signedParticipants = participants.filter(p => p.status === "signed")

  return (
    <div className="space-y-6">
      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Transacción a Firmar
          </CardTitle>
          <CardDescription>
            Detalles de la transacción que requiere firma distribuida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs text-muted-foreground">Hash de Transacción</label>
              <p className="font-mono text-sm">{transaction.hash}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Monto</label>
              <p className="font-semibold">{transaction.amount}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Destinatario</label>
              <p className="font-mono text-sm break-all">{transaction.recipient}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Timestamp</label>
              <p className="text-sm">{new Date(transaction.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FROST Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes FROST (2-de-3)
          </CardTitle>
          <CardDescription>
            Esquema de firma distribuida con umbral mínimo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {participants.map((participant) => (
              <div key={participant.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    {getStatusIcon(participant.status)}
                    {participant.name}
                  </h4>
                  <Badge variant={getParticipantVariant(participant.status)}>
                    {participant.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Share</label>
                    <p className="font-mono text-xs break-all">{participant.share}</p>
                  </div>
                  
                  {participant.commitment && (
                    <div>
                      <label className="text-xs text-muted-foreground">Commitment</label>
                      <p className="font-mono text-xs break-all">{participant.commitment}</p>
                    </div>
                  )}
                  
                  {participant.signature && (
                    <div>
                      <label className="text-xs text-muted-foreground">Signature</label>
                      <p className="font-mono text-xs break-all">{participant.signature}</p>
                    </div>
                  )}
                </div>
                
                {participant.status === "idle" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => commitParticipant(participant.id)}
                    className="w-full"
                  >
                    Comprometer {participant.id}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Signing Actions */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => signWithParticipants(["A"])}
                variant="outline"
                disabled={transactionSigned}
              >
                Intentar firmar solo con A
              </Button>
              <Button
                onClick={() => signWithParticipants(["A", "B"])}
                disabled={transactionSigned}
              >
                Firmar con A + B
              </Button>
              <Button
                onClick={() => signWithParticipants(["B", "C"])}
                disabled={transactionSigned}
              >
                Firmar con B + C
              </Button>
              <Button
                onClick={resetDemo}
                variant="secondary"
              >
                Reiniciar Demo
              </Button>
            </div>

            {activeParticipants.length === 1 && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Umbral insuficiente:</strong> Se necesitan 2 de 3 participantes para completar la firma.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Results */}
      {(signatureLatency || aggregatedSignature) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {transactionSigned ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Resultado de la Firma
            </CardTitle>
            <CardDescription>
              Estado y métricas del proceso de firma distribuida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Latencia de Firma</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{signatureLatency}ms</span>
                  {signatureLatency && signatureLatency < 1500 && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Rápido</Badge>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Participantes Activos</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{signedParticipants.length}/3</span>
                  <Badge variant={signedParticipants.length >= 2 ? "default" : "secondary"}>
                    {signedParticipants.length >= 2 ? "Suficiente" : "Insuficiente"}
                  </Badge>
                </div>
              </div>
            </div>

            {aggregatedSignature && (
              <div>
                <label className="text-xs text-muted-foreground">Firma Agregada FROST</label>
                <p className="font-mono text-sm bg-muted p-3 rounded break-all">
                  {aggregatedSignature}
                </p>
              </div>
            )}

            {transactionSigned && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Transacción firmada exitosamente.</strong> La clave privada nunca existió de forma completa - se combinaron firmas parciales de forma segura.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Ventajas de FROST</CardTitle>
          <CardDescription>
            Beneficios de seguridad del esquema de firma distribuida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Sin Punto Único de Fallo
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• La clave privada nunca existe completa</li>
                <li>• Compromise de 1 share no afecta seguridad</li>
                <li>• Redundancia garantizada (2-de-3)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Eficiencia Operacional
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Latencia baja ({signatureLatency || "~1200"}ms)</li>
                <li>• No requiere coordinación de todas las partes</li>
                <li>• Escalable a más participantes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}