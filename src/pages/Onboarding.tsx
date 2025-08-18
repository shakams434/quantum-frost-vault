import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Key, Zap, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EntropyMetrics {
  shannon: number
  monobit: number
  runs: number
  quality: number
  generationTime: number
  onesPercent: number
  zerosPercent: number
}

export default function Onboarding() {
  console.log("Onboarding component rendering");
  const [usePRNG, setUsePRNG] = useState(true)
  const [bits, setBits] = useState("")
  const [metrics, setMetrics] = useState<EntropyMetrics | null>(null)
  const [userDID, setUserDID] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Linear Congruential Generator (weak PRNG)
  const generateLCGBits = (seed: number, count: number): string => {
    let current = seed
    let result = ""
    const a = 1664525
    const c = 1013904223
    const m = Math.pow(2, 32)
    
    for (let i = 0; i < count; i++) {
      current = (a * current + c) % m
      result += (current % 2).toString()
    }
    return result
  }

  // Strong random using crypto API
  const generateQRNGBits = (count: number): string => {
    const bytes = new Uint8Array(Math.ceil(count / 8))
    crypto.getRandomValues(bytes)
    let result = ""
    for (let i = 0; i < count; i++) {
      const byteIndex = Math.floor(i / 8)
      const bitIndex = i % 8
      const bit = (bytes[byteIndex] >> bitIndex) & 1
      result += bit.toString()
    }
    return result.slice(0, count)
  }

  const calculateEntropy = (bits: string): EntropyMetrics => {
    const start = performance.now()
    
    const ones = bits.split('1').length - 1
    const zeros = bits.split('0').length - 1
    const total = bits.length
    
    // Shannon entropy
    const p1 = ones / total
    const p0 = zeros / total
    const shannon = -(p1 * Math.log2(p1 || 1) + p0 * Math.log2(p0 || 1))
    
    // Monobit test (should be close to 0.5)
    const monobit = Math.abs(0.5 - p1)
    
    // Runs test (simplified)
    let runs = 1
    for (let i = 1; i < bits.length; i++) {
      if (bits[i] !== bits[i - 1]) runs++
    }
    const expectedRuns = 2 * p1 * p0 * total + 1
    const runsTest = Math.abs(runs - expectedRuns) / Math.sqrt(expectedRuns)
    
    // Quality score (0-100)
    const entropyScore = (shannon / 1) * 40
    const monobitScore = (1 - monobit * 2) * 30
    const runsScore = Math.max(0, (1 - runsTest / 10)) * 30
    const quality = Math.min(100, entropyScore + monobitScore + runsScore)
    
    const generationTime = performance.now() - start
    
    return {
      shannon: Number(shannon.toFixed(4)),
      monobit: Number(monobit.toFixed(4)),
      runs: Number(runsTest.toFixed(2)),
      quality: Number(quality.toFixed(1)),
      generationTime: Number(generationTime.toFixed(2)),
      onesPercent: Number((p1 * 100).toFixed(1)),
      zerosPercent: Number((p0 * 100).toFixed(1))
    }
  }

  const generateBits = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate processing
    
    const generatedBits = usePRNG 
      ? generateLCGBits(12345, 1024) // Fixed seed for demo
      : generateQRNGBits(1024)
    
    setBits(generatedBits)
    setMetrics(calculateEntropy(generatedBits))
    setIsGenerating(false)
  }

  const createUserDID = () => {
    const uuid = crypto.randomUUID()
    setUserDID(`did:demo:user:${uuid}`)
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return "text-green-600"
    if (quality >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityVariant = (quality: number) => {
    if (quality >= 80) return "default"
    if (quality >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Generator Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Configuración del Generador
            </CardTitle>
            <CardDescription>
              Selecciona el tipo de generador de números aleatorios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="prng-toggle"
                checked={!usePRNG}
                onCheckedChange={(checked) => setUsePRNG(!checked)}
              />
              <Label htmlFor="prng-toggle" className="text-sm">
                {usePRNG ? "PRNG débil (LCG)" : "QRNG (simulada)"}
              </Label>
            </div>
            
            {!usePRNG && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Simulada, no hardware cuántico real
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={generateBits} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generando..." : "Generar 1024 bits"}
            </Button>

            {bits && (
              <div className="p-3 bg-muted rounded-md">
                <Label className="text-xs text-muted-foreground">Bits generados (primeros 64):</Label>
                <p className="font-mono text-xs break-all mt-1">
                  {bits.slice(0, 64)}...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entropy Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Métricas de Entropía
            </CardTitle>
            <CardDescription>
              Análisis de calidad de aleatoriedad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics ? (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Entropía de Shannon:</span>
                    <Badge variant="outline">{metrics.shannon}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Test Monobit:</span>
                    <Badge variant="outline">{metrics.monobit}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Test de rachas:</span>
                    <Badge variant="outline">{metrics.runs}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tiempo generación:</span>
                    <Badge variant="outline">{metrics.generationTime}ms</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Calidad de aleatoriedad</span>
                    <span className={getQualityColor(metrics.quality)}>
                      {metrics.quality}%
                    </span>
                  </div>
                  <Progress 
                    value={metrics.quality} 
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-semibold">{metrics.onesPercent}%</div>
                    <div className="text-muted-foreground">Unos</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-semibold">{metrics.zerosPercent}%</div>
                    <div className="text-muted-foreground">Ceros</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Genera bits para ver las métricas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User DID Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Identidad del Usuario
          </CardTitle>
          <CardDescription>
            Crear DID (Decentralized Identifier) del usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button onClick={createUserDID}>
              Crear DID del usuario
            </Button>
            {userDID && (
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">DID generado:</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded mt-1 break-all">
                  {userDID}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}