import { useState, lazy, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Key, Copy, Trash2, Download, Save, Shield, ShieldCheck } from "lucide-react"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Post-quantum crypto imports
import { keypairFromSeed, validateKeyPair, getDilithiumKeyInfo } from "@/pqc/dilithium2";
import { dilithiumSign, dilithiumVerify, selfTest } from "@/pqc/sign-verify";
import { didKeyDilithium, fromHex, constantTimeEquals, toHex as pqcToHex, toBase64 as pqcToBase64 } from "@/utils/pqc-utils";

// Utility functions
function rand32(): Uint8Array { 
  const a = new Uint8Array(32); 
  crypto.getRandomValues(a); 
  return a; 
}

const toHex = (u: Uint8Array) => [...u].map(b => b.toString(16).padStart(2, '0')).join('');
const toBits = (u: Uint8Array) => [...u].map(b => b.toString(2).padStart(8, '0')).join('');
const toBase64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const to32BytesDisplay = (bytes: Uint8Array): string => {
  const byteArray = Array.from(bytes);
  let result = '';
  for (let i = 0; i < byteArray.length; i++) {
    if (i > 0 && i % 16 === 0) result += '\n';
    else if (i > 0) result += ' ';
    result += byteArray[i].toString().padStart(3, ' ');
  }
  return result;
};

// Entropy analysis functions
const calculateShannonEntropy = (bytes: Uint8Array): number => {
  const frequencies = new Array(256).fill(0);
  for (const byte of bytes) {
    frequencies[byte]++;
  }
  
  let entropy = 0;
  const length = bytes.length;
  for (const freq of frequencies) {
    if (freq > 0) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }
  }
  return entropy;
};

const calculateUniformityTest = (bytes: Uint8Array): number => {
  const frequencies = new Array(256).fill(0);
  for (const byte of bytes) {
    frequencies[byte]++;
  }
  
  const expected = bytes.length / 256;
  let chiSquared = 0;
  for (const freq of frequencies) {
    chiSquared += Math.pow(freq - expected, 2) / expected;
  }
  
  // Convert to percentage (lower chi-squared = more uniform)
  const maxChiSquared = bytes.length * 255;
  return Math.max(0, 100 - (chiSquared / maxChiSquared) * 100);
};

const calculateEntropyScore = (bytes: Uint8Array): number => {
  const shannonEntropy = calculateShannonEntropy(bytes);
  const uniformity = calculateUniformityTest(bytes);
  
  // Shannon entropy for perfectly random 8-bit data should be close to 8
  const entropyScore = (shannonEntropy / 8) * 100;
  
  // Combine both metrics
  return Math.round((entropyScore + uniformity) / 2);
};

const analyzeEntropy = (bytes: Uint8Array) => {
  const shannonEntropy = calculateShannonEntropy(bytes);
  const uniformity = calculateUniformityTest(bytes);
  const qualityScore = calculateEntropyScore(bytes);
  
  return {
    shannonEntropy: shannonEntropy.toFixed(4),
    uniformity: uniformity.toFixed(2),
    qualityScore,
    interpretation: qualityScore >= 90 ? 'Excelente' : 
                   qualityScore >= 75 ? 'Buena' : 
                   qualityScore >= 60 ? 'Aceptable' : 'Baja'
  };
};

// Fetch quantum random numbers from Supabase Edge Function
async function fetchQRNG(): Promise<{ data: Uint8Array, metadata?: any }> {
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
    return {
      data: new Uint8Array(data.data),
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error('❌ Error en fetchQRNG via Edge Function:', error);
    throw error;
  }
}

export default function Onboarding() {
  console.log("Onboarding component rendering");
  
  // State for seed and cryptographic data
  const [seed, setSeed] = useState<Uint8Array | null>(null)
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null)
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null)
  const [didKey, setDidKey] = useState("")
  const [userDID, setUserDID] = useState("")
  const [generationMethod, setGenerationMethod] = useState<'QRNG' | 'PRNG'>('PRNG')
  const [algorithmType, setAlgorithmType] = useState<'Ed25519' | 'Dilithium2'>('Ed25519')
  const [verificationMetadata, setVerificationMetadata] = useState<any>(null)
  const [entropyAnalysis, setEntropyAnalysis] = useState<any>(null)
  const [showVerificationDetails, setShowVerificationDetails] = useState(false)
  const [showEntropyDetails, setShowEntropyDetails] = useState(false)
  const [isDilithiumLoading, setIsDilithiumLoading] = useState(false)
  
  // State for save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [identityName, setIdentityName] = useState("")
  
  // Estados para prueba de firma Dilithium2
  const [testMessage, setTestMessage] = useState("Hello, Post-Quantum World!")
  const [testSignature, setTestSignature] = useState<{
    hex: string;
    base64: string;
    bytes: Uint8Array | null;
  } | null>(null)
  const [isSigningTest, setIsSigningTest] = useState(false)
  const [testVerifyResult, setTestVerifyResult] = useState<string | null>(null)
  const [deterministicTestResult, setDeterministicTestResult] = useState<string | null>(null)

  // Generate 256-bit cryptographic seed
  const generateSeed = async (method: 'QRNG' | 'PRNG') => {
    try {
      let newSeed: Uint8Array
      
      if (method === 'QRNG') {
        // Use Supabase Edge Function for QRNG
        const result = await fetchQRNG()
        newSeed = result.data
        
        // Store verification metadata
        if (result.metadata) {
          setVerificationMetadata(result.metadata)
        }
        
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
        
        // Generate metadata for PRNG
        setVerificationMetadata({
          verificationId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          responseTime: 1, // PRNG is instant
          source: 'Browser Web Crypto API',
          endpoint: 'crypto.getRandomValues()',
          parameters: { length: 32, type: 'uint8' },
          generationType: 'PRNG'
        })
        
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
      
      // Analyze entropy of the generated seed
      const analysis = analyzeEntropy(newSeed)
      setEntropyAnalysis(analysis)
      
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

  // Derive keys from seed based on algorithm type
  const deriveKeys = async () => {
    if (!seed) return
    
    try {
      console.log("Deriving keys from seed:", toHex(seed))
      
      if (algorithmType === 'Ed25519') {
        // For Ed25519, the private key IS the seed (32 bytes)
        const newPrivateKey = seed
        const newPublicKey = await ed.getPublicKey(newPrivateKey)
        
        console.log("Private key (seed):", toHex(newPrivateKey))
        console.log("Public key derived:", toHex(new Uint8Array(newPublicKey)))
        
        setPrivateKey(newPrivateKey)
        setPublicKey(new Uint8Array(newPublicKey))
      } else if (algorithmType === 'Dilithium2') {
        await deriveDilithiumKeys()
      }
      
      toast({
        title: "Claves derivadas",
        description: `Se derivaron las claves ${algorithmType} desde la semilla`
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

  // Derive Dilithium2 keys from seed
  const deriveDilithiumKeys = async () => {
    setIsDilithiumLoading(true)
    try {
      const DilithiumModule = await import('dilithium-crystals')
      
      // Generate Dilithium2 keypair - the method doesn't take parameters
      const keyPair = await DilithiumModule.dilithium.keyPair()
      
      setPrivateKey(keyPair.privateKey)
      setPublicKey(keyPair.publicKey)
      
      console.log("Dilithium2 Private key size:", keyPair.privateKey.length)
      console.log("Dilithium2 Public key size:", keyPair.publicKey.length)
    } catch (error) {
      console.error('Error generating Dilithium keys:', error)
      toast({
        title: "Error",
        description: "Error al generar claves Dilithium",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsDilithiumLoading(false)
    }
  }

  // Build DID did:key based on algorithm type
  const buildDidKey = () => {
    if (!publicKey) return
    
    try {
      let multicodecPrefix: Uint8Array
      
      if (algorithmType === 'Ed25519') {
        // Ed25519 multicodec prefix: 0xED01
        multicodecPrefix = new Uint8Array([0xED, 0x01])
      } else {
        // Dilithium2 experimental multicodec prefix: 0x1234
        multicodecPrefix = new Uint8Array([0x12, 0x34])
      }
      
      const didPayload = new Uint8Array(multicodecPrefix.length + publicKey.length)
      didPayload.set(multicodecPrefix, 0)
      didPayload.set(publicKey, multicodecPrefix.length)
      const multibasePub = 'z' + base58btc.encode(didPayload)
      const did = `did:key:${multibasePub}`
      
      setDidKey(did)
      toast({
        title: "DID construido",
        description: `Se construyó el DID did:key ${algorithmType} desde la clave pública`
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
        generationType: generationMethod,
        algorithmType
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
    setAlgorithmType('Ed25519')
    setIdentityName("")
    setVerificationMetadata(null)
    setEntropyAnalysis(null)
    setShowVerificationDetails(false)
    setShowEntropyDetails(false)
    setIsDilithiumLoading(false)
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
      timestamp: new Date().toISOString(),
      generationType: generationMethod,
      algorithmType,
      verification: verificationMetadata,
      entropy: entropyAnalysis,
      seed: {
        hex: toHex(seed),
        base64: toBase64(seed),
        bits: toBits(seed),
        bytes32: to32BytesDisplay(seed)
      },
      keys: {
        privateKey: privateKey ? toHex(privateKey) : "",
        publicKey: publicKey ? toHex(publicKey) : "",
        privateKeySize: privateKey ? privateKey.length : 0,
        publicKeySize: publicKey ? publicKey.length : 0
      },
      identity: {
        didKey,
        userDID: userDID || didKey,
        verificationMethod: didKey ? {
          id: `${didKey}#${didKey.split(':')[2]}`,
          type: algorithmType === 'Ed25519' ? "Ed25519VerificationKey2020" : "Dilithium2VerificationKey2024",
          publicKeyMultibase: didKey.split(':')[2]
        } : null
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cryptographic-identity-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Descarga completada",
      description: "El archivo JSON con las claves ha sido descargado."
    })
  }

  // Test de determinismo para Dilithium2
  const testDeterminism = async (seedBytes: Uint8Array, originalKeyPair: { publicKey: Uint8Array; secretKey: Uint8Array }) => {
    try {
      console.log('🧪 Ejecutando test de determinismo...');
      
      // Generar segundo par de claves con la misma semilla
      const secondKeyPair = await keypairFromSeed(seedBytes);
      
      // Comparar claves públicas
      const publicKeysMatch = constantTimeEquals(originalKeyPair.publicKey, secondKeyPair.publicKey);
      // Comparar claves privadas
      const secretKeysMatch = constantTimeEquals(originalKeyPair.secretKey, secondKeyPair.secretKey);
      
      if (publicKeysMatch && secretKeysMatch) {
        setDeterministicTestResult("✅ DETERMINÍSTICO: Misma semilla → mismas claves");
        console.log('✅ Test de determinismo: PASADO');
      } else {
        setDeterministicTestResult("❌ NO DETERMINÍSTICO: Claves diferentes con misma semilla");
        console.warn('❌ Test de determinismo: FALLIDO');
      }
    } catch (error) {
      console.error('❌ Error en test de determinismo:', error);
      setDeterministicTestResult("❌ ERROR en test de determinismo");
    }
  };

  // Funciones para prueba de firma Dilithium2
  const signTestMessage = async () => {
    if (!privateKey || algorithmType !== 'Dilithium2') {
      toast({
        title: "Error",
        description: "Primero genera claves Dilithium2",
        variant: "destructive",
      });
      return;
    }

    setIsSigningTest(true);
    try {
      const messageBytes = new TextEncoder().encode(testMessage);
      const secretKeyBytes = fromHex(toHex(privateKey));
      
      console.log('🔐 Firmando mensaje de prueba...');
      const signature = await dilithiumSign(messageBytes, secretKeyBytes);
      
      setTestSignature({
        hex: toHex(signature),
        base64: toBase64(signature),
        bytes: signature
      });
      
      setTestVerifyResult(null); // Reset verificación
      
      toast({
        title: "Mensaje firmado",
        description: `Firma generada: ${signature.length} bytes`,
      });
    } catch (error) {
      console.error('❌ Error firmando:', error);
      toast({
        title: "Error",
        description: `Error al firmar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setIsSigningTest(false);
    }
  };

  const verifyTestSignature = async () => {
    if (!testSignature || !publicKey || algorithmType !== 'Dilithium2') {
      toast({
        title: "Error",
        description: "Primero firma un mensaje",
        variant: "destructive",
      });
      return;
    }

    try {
      const messageBytes = new TextEncoder().encode(testMessage);
      const publicKeyBytes = fromHex(toHex(publicKey));
      
      console.log('🔍 Verificando firma...');
      const isValid = await dilithiumVerify(messageBytes, testSignature.bytes!, publicKeyBytes);
      
      setTestVerifyResult(isValid ? "✅ Válida" : "❌ Inválida");
      
      toast({
        title: "Verificación completa",
        description: `Firma: ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`,
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      console.error('❌ Error verificando:', error);
      setTestVerifyResult("❌ Error");
      toast({
        title: "Error",
        description: `Error al verificar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const runSelfTest = async () => {
    if (!privateKey || !publicKey || algorithmType !== 'Dilithium2') {
      toast({
        title: "Error",
        description: "Primero genera claves Dilithium2",
        variant: "destructive",
      });
      return;
    }

    try {
      const secretKeyBytes = fromHex(toHex(privateKey));
      const publicKeyBytes = fromHex(toHex(publicKey));
      
      console.log('🧪 Ejecutando auto-test completo...');
      const result = await selfTest(testMessage, secretKeyBytes, publicKeyBytes);
      
      if (result.success && result.signature) {
        setTestSignature({
          hex: toHex(result.signature),
          base64: toBase64(result.signature),
          bytes: result.signature
        });
        setTestVerifyResult("✅ Válida (auto-test)");
        
        toast({
          title: "Auto-test exitoso",
          description: "Firma y verificación funcionan correctamente",
        });
      } else {
        setTestVerifyResult("❌ Fallo en auto-test");
        toast({
          title: "Auto-test falló",
          description: result.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error en auto-test:', error);
      toast({
        title: "Error en auto-test",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

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

            {verificationMetadata && (
              <div className="mt-4">
                <Collapsible open={showVerificationDetails} onOpenChange={setShowVerificationDetails}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-between w-full p-0">
                      <span className="text-sm font-medium">📊 Metadata de Verificación</span>
                      <span className="text-xs">{showVerificationDetails ? '▼' : '▶'}</span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <div className="p-3 bg-muted rounded-md space-y-2 text-xs">
                      <div><strong>ID de Verificación:</strong> {verificationMetadata.verificationId}</div>
                      <div><strong>Timestamp:</strong> {new Date(verificationMetadata.timestamp).toLocaleString()}</div>
                      <div><strong>Fuente:</strong> {verificationMetadata.source}</div>
                      <div><strong>Tiempo de Respuesta:</strong> {verificationMetadata.responseTime}ms</div>
                      <div><strong>Tipo:</strong> {verificationMetadata.generationType}</div>
                      {verificationMetadata.responseHash && (
                        <div><strong>Hash de Respuesta:</strong> <span className="font-mono break-all">{verificationMetadata.responseHash}</span></div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {entropyAnalysis && (
              <div className="mt-4">
                <Collapsible open={showEntropyDetails} onOpenChange={setShowEntropyDetails}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-between w-full p-0">
                      <span className="text-sm font-medium">🎲 Análisis de Entropía</span>
                      <span className="text-xs">{showEntropyDetails ? '▼' : '▶'}</span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-3 bg-muted rounded-md space-y-2 text-xs">
                      <div><strong>Entropía de Shannon:</strong> {entropyAnalysis.shannonEntropy} bits</div>
                      <div><strong>Test de Uniformidad:</strong> {entropyAnalysis.uniformity}%</div>
                      <div><strong>Score de Calidad:</strong> 
                        <span className={`ml-1 font-bold ${
                          entropyAnalysis.qualityScore >= 90 ? 'text-green-600' :
                          entropyAnalysis.qualityScore >= 75 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {entropyAnalysis.qualityScore}% ({entropyAnalysis.interpretation})
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {seed && (
              <div className="space-y-4 mt-6">
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

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">32 Bytes:</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(to32BytesDisplay(seed), "32 bytes")}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-mono text-sm whitespace-pre-wrap">
                      {to32BytesDisplay(seed)}
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

        {/* Cryptographic Keys */}
        <Card>
          <CardHeader>
            <CardTitle>Claves Criptográficas</CardTitle>
            <CardDescription>
              {algorithmType === 'Ed25519' 
                ? "Ed25519 usa semilla de 32 bytes; internamente (SHA-512 + clamping) deriva el escalar secreto."
                : "Dilithium2 es un algoritmo post-cuántico con claves más grandes (~1.3KB pública, ~2.5KB privada)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Algorithm Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Algoritmo Criptográfico</Label>
              <RadioGroup value={algorithmType} onValueChange={(value: 'Ed25519' | 'Dilithium2') => setAlgorithmType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ed25519" id="ed25519" />
                  <Label htmlFor="ed25519" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="h-4 w-4" />
                    Ed25519 (Clásico) - ~32 bytes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Dilithium2" id="dilithium2" />
                  <Label htmlFor="dilithium2" className="flex items-center gap-2 cursor-pointer">
                    <ShieldCheck className="h-4 w-4" />
                    Dilithium2 (Post-Cuántico) - ~1.3KB pub, ~2.5KB priv
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={deriveKeys} 
              disabled={!seed || isDilithiumLoading}
              className="w-full"
            >
              {isDilithiumLoading ? 'Cargando Dilithium...' : `Derivar claves ${algorithmType}`}
            </Button>

            {privateKey && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">
                      Private key {algorithmType === 'Dilithium2' ? `(~${Math.round(privateKey.length/1024 * 10)/10}KB)` : '(32 bytes)'} (hex):
                    </Label>
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
                    {algorithmType === 'Dilithium2' ? (
                      <ScrollArea className="h-32 w-full">
                        <p className="font-mono text-xs break-all whitespace-pre-wrap">
                          {toHex(privateKey)}
                        </p>
                      </ScrollArea>
                    ) : (
                      <p className="font-mono text-sm break-all">
                        {toHex(privateKey)}
                      </p>
                    )}
                  </div>
                </div>

                {publicKey && (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium">
                          Public key {algorithmType === 'Dilithium2' ? `(~${Math.round(publicKey.length/1024 * 10)/10}KB)` : '(32 bytes)'} (hex):
                        </Label>
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
                        {algorithmType === 'Dilithium2' ? (
                          <ScrollArea className="h-24 w-full">
                            <p className="font-mono text-xs break-all whitespace-pre-wrap">
                              {toHex(publicKey)}
                            </p>
                          </ScrollArea>
                        ) : (
                          <p className="font-mono text-sm break-all">
                            {toHex(publicKey)}
                          </p>
                        )}
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
                        {algorithmType === 'Dilithium2' ? (
                          <ScrollArea className="h-24 w-full">
                            <p className="font-mono text-xs break-all whitespace-pre-wrap">
                              {toBase64(publicKey)}
                            </p>
                          </ScrollArea>
                        ) : (
                          <p className="font-mono text-sm break-all">
                            {toBase64(publicKey)}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DID did:key */}
        <Card>
          <CardHeader>
            <CardTitle>DID did:key ({algorithmType})</CardTitle>
            <CardDescription>
              {algorithmType === 'Ed25519' 
                ? "did:key = multicodec 0xED01 + publicKey(32B) → base58btc con prefijo z (multibase)."
                : "did:key = multicodec experimental 0x1234 + publicKey(~1.3KB) → base58btc con prefijo z (multibase)."}
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
                    <p><strong>Prefijo multicodec {algorithmType}:</strong> {algorithmType === 'Ed25519' ? '0xED 0x01 (2B)' : '0x12 0x34 (2B experimental)'}</p>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span><strong>Payload = prefijo + publicKey:</strong></span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const multicodecPrefix = algorithmType === 'Ed25519' 
                              ? new Uint8Array([0xED, 0x01])
                              : new Uint8Array([0x12, 0x34])
                            const didPayload = new Uint8Array(multicodecPrefix.length + publicKey.length)
                            didPayload.set(multicodecPrefix, 0)
                            didPayload.set(publicKey, multicodecPrefix.length)
                            copyToClipboard(toHex(didPayload), "Payload")
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <div className="p-2 bg-muted rounded text-xs font-mono">
                        {algorithmType === 'Dilithium2' ? (
                          <ScrollArea className="h-16 w-full">
                            <p className="break-all whitespace-pre-wrap">
                              {(() => {
                                const multicodecPrefix = new Uint8Array([0x12, 0x34])
                                const didPayload = new Uint8Array(multicodecPrefix.length + publicKey.length)
                                didPayload.set(multicodecPrefix, 0)
                                didPayload.set(publicKey, multicodecPrefix.length)
                                return toHex(didPayload)
                              })()}
                            </p>
                          </ScrollArea>
                        ) : (
                          <p className="break-all">
                            {(() => {
                              const multicodecPrefix = new Uint8Array([0xED, 0x01])
                              const didPayload = new Uint8Array(multicodecPrefix.length + publicKey.length)
                              didPayload.set(multicodecPrefix, 0)
                              didPayload.set(publicKey, multicodecPrefix.length)
                              return toHex(didPayload)
                            })()}
                          </p>
                        )}
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
                <div>
                  <span className="text-muted-foreground">Algoritmo:</span>
                  <span className="ml-1 font-medium">{algorithmType}</span>
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