import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileCheck, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface VerifiableCredential {
  "@context": string[]
  id: string
  type: string[]
  issuer: string
  issuanceDate: string
  subject: {
    id: string
    accountId: string
    kycLevel: string
    holderName: string
  }
  proof: {
    type: string
    created: string
    jws: string
  }
}

export default function Credenciales() {
  const [accountId, setAccountId] = useState("")
  const [kycLevel, setKycLevel] = useState("")
  const [holderName, setHolderName] = useState("")
  const [userDID, setUserDID] = useState("")
  const [credential, setCredential] = useState<VerifiableCredential | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "valid" | "invalid" | null>(null)

  const issueCredential = () => {
    if (!accountId || !kycLevel || !holderName || !userDID) {
      alert("Todos los campos son requeridos")
      return
    }

    const now = new Date().toISOString()
    const credentialId = `urn:uuid:${crypto.randomUUID()}`
    
    // Simulated JWS signature
    const fakeJWS = "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJkaWQ6ZGVtbzp1c2VyOjEyMyIsImFjY291bnRJZCI6IkFDQzAwMTIzIiwiaWF0IjoxNjk5MDA0MDAwfQ.fake_signature_for_demo_purposes_only"
    
    const vc: VerifiableCredential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://example.com/contexts/banking/v1"
      ],
      id: credentialId,
      type: ["VerifiableCredential", "BankAccountCredential"],
      issuer: "did:demo:bank:central",
      issuanceDate: now,
      subject: {
        id: userDID,
        accountId,
        kycLevel,
        holderName
      },
      proof: {
        type: "JsonWebSignature2020",
        created: now,
        jws: fakeJWS
      }
    }

    setCredential(vc)
    setVerificationStatus("pending")
    
    // Simulate verification after a delay
    setTimeout(() => {
      setVerificationStatus("valid")
    }, 1500)
  }

  const verifyCredential = () => {
    if (!credential) return
    
    setVerificationStatus("pending")
    
    // Simulate verification process
    setTimeout(() => {
      // For demo purposes, randomly pass/fail verification
      const isValid = Math.random() > 0.2 // 80% success rate
      setVerificationStatus(isValid ? "valid" : "invalid")
    }, 1000)
  }

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Verificando...
        </Badge>
      case "valid":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3" />
          Válida
        </Badge>
      case "invalid":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Inválida
        </Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credential Issuance Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Emisión de Credencial Verificable
            </CardTitle>
            <CardDescription>
              Crear una BankAccountCredential para el usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-did">DID del Usuario</Label>
              <Input
                id="user-did"
                placeholder="did:demo:user:uuid"
                value={userDID}
                onChange={(e) => setUserDID(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-id">ID de Cuenta</Label>
              <Input
                id="account-id"
                placeholder="ACC001234"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kyc-level">Nivel KYC</Label>
              <Select value={kycLevel} onValueChange={setKycLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="holder-name">Nombre del Titular</Label>
              <Input
                id="holder-name"
                placeholder="Juan Pérez"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
              />
            </div>

            <Button onClick={issueCredential} className="w-full">
              Emitir Credencial Verificable
            </Button>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Firma JWS simulada:</strong> En producción se usaría una clave privada real del emisor.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Credential Display and Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Credencial Emitida
              </span>
              {getVerificationBadge()}
            </CardTitle>
            <CardDescription>
              Visualización y verificación de la credencial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {credential ? (
              <>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo:</Label>
                    <p className="text-sm font-mono">{credential.type.join(", ")}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Emisor:</Label>
                    <p className="text-sm font-mono">{credential.issuer}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha de emisión:</Label>
                    <p className="text-sm">{new Date(credential.issuanceDate).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Sujeto:</Label>
                    <div className="bg-muted p-3 rounded text-sm space-y-1">
                      <p><strong>DID:</strong> {credential.subject.id}</p>
                      <p><strong>Cuenta:</strong> {credential.subject.accountId}</p>
                      <p><strong>KYC:</strong> {credential.subject.kycLevel}</p>
                      <p><strong>Nombre:</strong> {credential.subject.holderName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Credencial JSON-LD completa:</Label>
                  <Textarea
                    value={JSON.stringify(credential, null, 2)}
                    readOnly
                    className="font-mono text-xs h-32"
                  />
                </div>

                <Button onClick={verifyCredential} variant="outline" className="w-full">
                  Verificar Credencial
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Emite una credencial para verla aquí
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Details */}
      {credential && verificationStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Panel de Verificación</CardTitle>
            <CardDescription>
              Proceso de validación de la credencial verificable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold">Estructura JSON-LD</h4>
                <p className="text-sm text-muted-foreground">Válida</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold">Firma JWS</h4>
                <p className="text-sm text-muted-foreground">Simulada - OK</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                {verificationStatus === "valid" ? (
                  <>
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-semibold">Estado General</h4>
                    <p className="text-sm text-muted-foreground">Verificación exitosa</p>
                  </>
                ) : verificationStatus === "invalid" ? (
                  <>
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <h4 className="font-semibold">Estado General</h4>
                    <p className="text-sm text-muted-foreground">Verificación fallida</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <h4 className="font-semibold">Estado General</h4>
                    <p className="text-sm text-muted-foreground">Verificando...</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}