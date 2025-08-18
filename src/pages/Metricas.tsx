import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, Download, TrendingUp, Shield, Clock, Zap } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

// Mock data for charts
const entropyComparison = [
  { name: 'PRNG débil', entropy: 0.7234, quality: 45 },
  { name: 'QRNG sim', entropy: 0.9987, quality: 98 }
]

const latencyData = [
  { operation: 'Gen. Claves', prng: 12, qrng: 15, frost: 1200 },
  { operation: 'Firma Simple', prng: 8, qrng: 10, frost: 45 },
  { operation: 'Firma FROST', prng: 0, qrng: 0, frost: 1180 },
  { operation: 'Verificación', prng: 25, qrng: 25, frost: 32 }
]

const securityMetrics = [
  { name: 'Predictabilidad', prng: 85, qrng: 0 },
  { name: 'Ataques cuánticos', prng: 90, qrng: 15 },
  { name: 'Punto único fallo', classic: 100, frost: 0 }
]

const pqcOverhead = [
  { name: 'Overhead PQC', value: 25 },
  { name: 'Baseline', value: 75 }
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

export default function Metricas() {
  const [generatingReport, setGeneratingReport] = useState(false)

  const generateReport = async () => {
    setGeneratingReport(true)
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real app, this would generate and download a PDF
    const reportData = {
      timestamp: new Date().toISOString(),
      executive_summary: {
        qrng_vs_prng: "QRNG simulada muestra 98% de calidad vs 45% PRNG débil",
        frost_benefits: "FROST elimina punto único de fallo con latencia <1.2s",
        pqc_readiness: "Overhead PQC +25% aceptable para migración regulatoria"
      },
      metrics: {
        entropy_improvement: "38% mejora en entropía",
        security_risk_reduction: "85% reducción en predictabilidad",
        operational_latency: "<1200ms para firma distribuida"
      },
      recommendations: [
        "Migrar a QRNG hardware para producción",
        "Implementar FROST para custodia crítica", 
        "Planificar migración PQC gradual"
      ]
    }
    
    // Create and download JSON report (simulating PDF)
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poc-custodia-reporte-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setGeneratingReport(false)
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Mejora Entropía</p>
                <p className="text-2xl font-bold">+38%</p>
                <Badge variant="default" className="mt-1">QRNG vs PRNG</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Reducción Riesgo</p>
                <p className="text-2xl font-bold">85%</p>
                <Badge variant="default" className="mt-1">Predictabilidad</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Latencia FROST</p>
                <p className="text-2xl font-bold">1.18s</p>
                <Badge variant="default" className="mt-1">Firma 2-de-3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overhead PQC</p>
                <p className="text-2xl font-bold">+25%</p>
                <Badge variant="secondary" className="mt-1">Aceptable</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entropy Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Entropía: PRNG vs QRNG</CardTitle>
          <CardDescription>
            Calidad de aleatoriedad y entropía de Shannon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entropyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="entropy" fill={COLORS[0]} name="Entropía Shannon" />
                <Bar dataKey="quality" fill={COLORS[1]} name="Calidad %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Latency Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Latencia por Operación</CardTitle>
          <CardDescription>
            Tiempo de procesamiento en milisegundos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operation" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="prng" fill={COLORS[0]} name="PRNG" />
                <Bar dataKey="qrng" fill={COLORS[1]} name="QRNG" />
                <Bar dataKey="frost" fill={COLORS[2]} name="FROST" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Riesgos de Seguridad</CardTitle>
            <CardDescription>
              Porcentaje de riesgo por vector de ataque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityMetrics.map((metric, index) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{metric.name}</span>
                    <div className="flex gap-4">
                      {metric.prng !== undefined && (
                        <span className="text-red-600">PRNG: {metric.prng}%</span>
                      )}
                      {metric.qrng !== undefined && (
                        <span className="text-green-600">QRNG: {metric.qrng}%</span>
                      )}
                      {metric.classic !== undefined && (
                        <span className="text-red-600">Clásico: {metric.classic}%</span>
                      )}
                      {metric.frost !== undefined && (
                        <span className="text-green-600">FROST: {metric.frost}%</span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={metric.prng || metric.classic || 0} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PQC Overhead */}
        <Card>
          <CardHeader>
            <CardTitle>Overhead Post-Quantum Crypto</CardTitle>
            <CardDescription>
              Impacto en rendimiento del handshake
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pqcOverhead}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pqcOverhead.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                +25% Overhead Aceptable
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumen Ejecutivo
          </CardTitle>
          <CardDescription>
            Conclusiones clave para el Directorio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>QRNG Simulada:</strong> 98% de calidad vs 45% PRNG débil. Impredecibilidad garantizada para claves críticas.
              </AlertDescription>
            </Alert>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>FROST 2-de-3:</strong> Elimina punto único de fallo. Latencia <1.2s aceptable para operaciones críticas.
              </AlertDescription>
            </Alert>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Migración PQC:</strong> +25% overhead en handshake. Preparación regulatoria con impacto controlado.
              </AlertDescription>
            </Alert>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Recomendaciones Estratégicas:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Corto plazo:</strong> Implementar QRNG hardware para generación de claves en producción</li>
              <li>• <strong>Medio plazo:</strong> Desplegar FROST para custodia de activos críticos y multi-signature</li>
              <li>• <strong>Largo plazo:</strong> Migración gradual a PQC con overhead del 25% presupuestado</li>
              <li>• <strong>Compliance:</strong> Ventaja competitiva en auditorías de seguridad y regulación</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Generación de Reporte
          </CardTitle>
          <CardDescription>
            Exportar análisis completo para presentación ejecutiva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateReport} 
            disabled={generatingReport}
            className="w-full md:w-auto"
            size="lg"
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Generando reporte...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte PDF
              </>
            )}
          </Button>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>El reporte incluye:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Métricas comparativas de seguridad</li>
              <li>Análisis de costo-beneficio</li>
              <li>Roadmap de implementación</li>
              <li>Recomendaciones por fase</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}