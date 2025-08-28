import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Key, Copy, Trash2, Download, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { ed } from '../crypto-setup'
import { base58btc } from 'multiformats/bases/base58'
import { identityStorage } from "@/services/identityStorage"
import { supabase } from "@/integrations/supabase/client"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Utility functions
function rand32(): Uint8Array { 
  const a = new Uint8Array(32); 
  crypto.getRandomValues(a); 
  return a; 
}

// Fetch quantum random numbers from Supabase Edge Function
async function fetchQRNG(): Promise<Uint8Array> {
  console.log('🔄 Iniciando fetch a Edge Function QRNG...')
  
  try {
    const { data, error } = await supabase.functions.invoke('qrng-anu');
    
    if (error) {
      console.error('❌ Supabase function error:', error);
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error('❌ Invalid data format:', data);
      throw new Error('Invalid data format from quantum service');
    }
    
    if (data.data.length !== 32) {
      console.error('❌ Longitud incorrecta:', data.data.length);
      throw new Error(`Longitud incorrecta: esperaba 32 bytes, recibió ${data.data.length}`);
    }
    
    console.log('✅ Datos QRNG válidos recibidos via Edge Function');
    return new Uint8Array(data.data);
    
  } catch (error) {
    console.error('❌ Error en fetchQRNG via Edge Function:', error);
    throw error;
  }
}

const toHex = (u: Uint8Array) => [...u].map(b => b.toString(16).padStart(2, '0')).join('');
const toBits = (u: Uint8Array) => [...u].map(b => b.toString(2).padStart(8, '0')).join('');
const toBase64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));

export default function Onboarding() {
  console.log("Onboarding component rendering");
  
  // State for seed and cryptographic data
  const [seed, setSeed] = useState<Uint8Array | null>(null)
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null)
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null)
  const [didKey, setDidKey] = useState("")
  const [userDID, setUserDID] = useState("")
  const [generationMethod, setGenerationMethod] = useState<'QRNG' | 'PRNG'>('PRNG')
  
  // State for save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [identityName, setIdentityName] = useState("")

  // Generate 256-bit cryptographic seed
  const generateSeed = async (method: 'QRNG' | 'PRNG') => {
    try {
      let newSeed: Uint8Array
      
      if (method === 'QRNG') {
        // Use Supabase Edge Function for QRNG
        newSeed = await fetchQRNG()
        setSeed(newSeed)
        setGenerationMethod(method)
        // Clear derived keys when generating new seed
        setPrivateKey(null)
        setPublicKey(null)
        setDidKey("")
        setUserDID("")
        toast({
          title: "Semilla cuántica generada",
          description: "Se generó una semilla usando el generador cuántico de ANU."
        })
      } else {
        // Use browser's crypto API (PRNG)
        newSeed = rand32()
        setSeed(newSeed)
        setGenerationMethod(method)
        // Clear derived keys when generating new seed
        setPrivateKey(null)
        setPublicKey(null)
        setDidKey("")
        setUserDID("")
        toast({
          title: "Semilla pseudoaleatoria generada",
          description: "Se generó una semilla usando el generador pseudoaleatorio del navegador."
        })
      }
      
    } catch (error) {
      console.error(`Error generating seed with ${method}:`, error)
      if (method === 'QRNG') {
        toast({
          title: "Error",
          description: "No se pudo obtener la semilla cuántica, intente nuevamente",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar la semilla. Intente nuevamente.",
          variant: "destructive"
        })
      }
    }
  }

  // Derive Ed25519 keys from seed
  const deriveKeys = async () => {
    if (!seed) return
    
    try {
      console.log("Deriving keys from seed:", toHex(seed))
      
      // For Ed25519, the private key IS the seed (32 bytes)
      const newPrivateKey = seed
      const newPublicKey = await ed.getPublicKey(newPrivateKey)
      
      console.log("Private key (seed):", toHex(newPrivateKey))
      console.log("Public key derived:", toHex(new Uint8Array(newPublicKey)))
      
      setPrivateKey(newPrivateKey)
      setPublicKey(new Uint8Array(newPublicKey))
      
      toast({
        title: "Claves derivadas",
        description: "Se derivaron las claves Ed25519 desde la semilla"
      })
    } catch (error) {
      console.error("Error deriving keys:", error)
      toast({
        title: "Error",
        description: `No se pudieron derivar las claves: ${error.message || error}`,
        variant: "destructive"
      })
    }
  }

  // Build DID did:key
  const buildDidKey = () => {
    if (!publicKey) return
    
    try {
      const MULTICODEC_ED25519_PUB = new Uint8Array([0xED, 0x01])
      const didPayload = new Uint8Array(2 + publicKey.length)
      didPayload.set(MULTICODEC_ED25519_PUB, 0)
      didPayload.set(publicKey, 2)
      const multibasePub = 'z' + base58btc.encode(didPayload)
      const did = `did:key:${multibasePub}`
      
      setDidKey(did)
      toast({
        title: "DID construido",
        description: "Se construyó el DID did:key desde la clave pública"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo construir el DID",
        variant: "destructive"
      })
    }
  }

  // Generate user DID from existing did:key
  const generateUserDID = () => {
    if (didKey) {
      setUserDID(didKey)
      toast({
        title: "DID de usuario generado",
        description: "Se asignó el did:key como DID del usuario"
      })
    }
  }

  // Save identity to storage
  const saveIdentity = () => {
    if (!seed || !privateKey || !publicKey || !userDID) {
      toast({
        title: "Error",
        description: "Faltan datos para guardar la identidad",
        variant: "destructive"
      })
      return
    }

    try {
      const multibase = userDID.split(':')[2]
      const vmId = `${userDID}#${multibase}`
      
      const identityId = identityStorage.saveIdentity({
        customName: identityName.trim() || undefined,
        didKey: userDID,
        seed: toHex(seed),
        privateKey: toHex(privateKey),
        publicKey: toHex(publicKey),
        multibase,
        vmId,
        createdAt: new Date().toISOString(),
        generationType: generationMethod
      })

      toast({
        title: "Identidad guardada",
        description: `Identidad guardada correctamente${identityName ? ` como "${identityName}"` : ''}`
      })

      setShowSaveDialog(false)
      setIdentityName("")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la identidad",
        variant: "destructive"
      })
    }
  }

  // Clear all data from memory
  const clearMemory = () => {
    setSeed(null)
    setPrivateKey(null)
    setPublicKey(null)
    setDidKey("")
    setUserDID("")
    setGenerationMethod('PRNG')
    setIdentityName("")
    toast({
      title: "Memoria limpiada",
      description: "Se borró toda la información criptográfica"
    })
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`
    })
  }

  // Download JSON
  const downloadJson = () => {
    if (!seed) return
    
    const data = {
      seed_hex: seed ? toHex(seed) : "",
      private_key_seed_hex: privateKey ? toHex(privateKey) : "",
      public_key_hex: publicKey ? toHex(publicKey) : "",
      did_key: didKey,
      verificationMethod: didKey ? {
        id: `${didKey}#${didKey.split(':')[2]}`,
        type: "Ed25519VerificationKey2020",
        publicKeyMultibase: didKey.split(':')[2]
      } : null
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ed25519-keys.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      {/* Clear Memory Button */}
      <div className="flex justify-end">
        <Button onClick={clearMemory} variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Borrar en memoria
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Cryptographic Seed (256 bits = 32 bytes) */}
        <Card>
          <CardHeader>
            <CardTitle>Semilla criptográfica (256 bits = 32 bytes)</CardTitle>
            <CardDescription>
              QRNG usa números cuánticos reales de ANU. PRNG usa window.crypto.getRandomValues local.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => generateSeed('QRNG')} className="w-full">
                QRNG Real (ANU)
              </Button>
              <Button onClick={() => generateSeed('PRNG')} className="w-full" variant="outline">
                PRNG (WebCrypto)
              </Button>
            </div>

            {seed && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Bits (256):</Label>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-xs break-all">
                      {toBits(seed)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Hex (64 chars):</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(toHex(seed), "Hex")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm break-all">
                      {toHex(seed)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Base64:</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(toBase64(seed), "Base64")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm break-all">
                      {toBase64(seed)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setSeed(null)}>
                    Limpiar
                  </Button>
                  <Button variant="secondary" onClick={downloadJson}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar JSON
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ed25519 Keys */}
        <Card>
          <CardHeader>
            <CardTitle>Claves Ed25519</CardTitle>
            <CardDescription>
              Ed25519 usa semilla de 32 bytes; internamente (SHA-512 + clamping) deriva el escalar secreto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={deriveKeys} 
              disabled={!seed}
              className="w-full"
            >
              Derivar clave privada (desde la semilla de 32B)
            </Button>

            {privateKey && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Private key (seed) – 32 bytes (hex):</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(toHex(privateKey), "Clave privada")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm break-all">
                      {toHex(privateKey)}
                    </p>
                  </div>
                </div>

                {publicKey && (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium">Public key – 32 bytes (hex):</Label>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(toHex(publicKey), "Clave pública")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-mono text-sm break-all">
                          {toHex(publicKey)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium">Public key (base64):</Label>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(toBase64(publicKey), "Clave pública base64")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-mono text-sm break-all">
                          {toBase64(publicKey)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DID did:key (Ed25519) */}
        <Card>
          <CardHeader>
            <CardTitle>DID did:key (Ed25519)</CardTitle>
            <CardDescription>
              did:key = multicodec 0xED01 + publicKey(32B) → base58btc con prefijo z (multibase).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={buildDidKey} 
              disabled={!publicKey}
              className="w-full"
            >
              Construir DID did:key
            </Button>

            {didKey && publicKey && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Pasos y valores:</Label>
                  <div className="space-y-2 text-sm">
                    <p><strong>Prefijo multicodec ed25519-pub:</strong> 0xED 0x01 (2B)</p>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span><strong>Payload (34B) = prefijo + publicKey:</strong></span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const MULTICODEC_ED25519_PUB = new Uint8Array([0xED, 0x01])
                            const didPayload = new Uint8Array(2 + publicKey.length)
                            didPayload.set(MULTICODEC_ED25519_PUB, 0)
                            didPayload.set(publicKey, 2)
                            copyToClipboard(toHex(didPayload), "Payload")
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                        {(() => {
                          const MULTICODEC_ED25519_PUB = new Uint8Array([0xED, 0x01])
                          const didPayload = new Uint8Array(2 + publicKey.length)
                          didPayload.set(MULTICODEC_ED25519_PUB, 0)
                          didPayload.set(publicKey, 2)
                          return toHex(didPayload)
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span><strong>Multibase (base58btc):</strong></span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(didKey.split(':')[2], "Multibase")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                        {didKey.split(':')[2]}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">DID final:</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(didKey, "DID")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm break-all">
                      {didKey}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Identidad del Usuario
            </CardTitle>
            <CardDescription>
              Generar did:key desde la clave pública
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={generateUserDID} 
                disabled={!didKey}
                className="w-full"
              >
                Generar did:key (desde la clave pública)
              </Button>
              
              {userDID && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">DID generado:</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1 p-2 bg-muted rounded font-mono text-sm break-all">
                        {userDID}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(userDID, "DID del usuario")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowSaveDialog(true)} 
                    className="w-full"
                    variant="default"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar en Mis Identidades
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Identity Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar identidad</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identity-name">Nombre para esta identidad (opcional)</Label>
              <Input
                id="identity-name"
                value={identityName}
                onChange={(e) => setIdentityName(e.target.value)}
                placeholder="Ej: Mi identidad personal, Wallet principal..."
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Puedes dejar vacío para guardarlo sin nombre personalizado.
              </p>
            </div>

            <div className="p-3 bg-muted/30 rounded-md border">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">DID:</span>
                  <p className="font-mono break-all">{userDID}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-1 font-medium">{generationMethod}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveIdentity}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}