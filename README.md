# PoC – Custodia de Llaves con QRNG, CRYSTALS-Dilithium2, FROST y VC

Demo ejecutiva para evaluación de tecnologías de seguridad avanzada que incluye simulaciones de Generación de Números Aleatorios Cuánticos (QRNG), criptografía post-cuántica CRYSTALS-Dilithium2, firmas distribuidas FROST y manejo de credenciales verificables.

## 🚀 Instalación y Ejecución Local

### Prerequisitos
- **Node.js** (versión 16 o superior) - [Instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** o **yarn** (incluido con Node.js)

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# 2. Navegar al directorio del proyecto
cd <NOMBRE_DEL_PROYECTO>

# 3. Instalar dependencias
npm install
# o si usas yarn:
# yarn install

# 4. Iniciar el servidor de desarrollo
npm run dev
# o si usas yarn:
# yarn dev
```

La aplicación estará disponible en `http://localhost:8080`

### 📜 Comandos Disponibles

```bash
# Desarrollo - Servidor con hot reload
npm run dev

# Construcción para producción
npm run build

# Vista previa de la build de producción
npm run preview

# Linting del código
npm run lint
```

### 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI (shadcn)
│   ├── AppSidebar.tsx  # Navegación lateral
│   ├── Layout.tsx      # Layout principal
│   └── ErrorBoundary.tsx
├── pages/              # Páginas de la aplicación
│   ├── Onboarding.tsx  # Simulación QRNG vs PRNG + Dilithium2
│   ├── FROST.tsx       # Firma distribuida FROST
│   ├── Identidades.tsx # Gestión de identidades digitales
│   ├── Metricas.tsx    # Dashboard de métricas
│   └── NotFound.tsx    # Página 404
├── pqc/                # 🆕 Criptografía Post-Cuántica
│   ├── dilithium2.ts   # Generación determinística de claves
│   └── sign-verify.ts  # Firma y verificación Dilithium2
├── utils/              # 🆕 Utilidades criptográficas
│   └── pqc-utils.ts    # KDF, DID:key, codificación
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuración
├── services/           # Servicios de almacenamiento
└── index.css           # Estilos globales y tokens CSS
```

## 🔄 Sincronización con GitHub

Este proyecto está configurado con **sincronización bidireccional automática** con GitHub a través de Lovable:

- **Cambios en Lovable** → Se suben automáticamente a GitHub
- **Cambios en GitHub** → Se sincronizan automáticamente en Lovable

### Desarrollo Paralelo
Puedes trabajar tanto en Lovable como localmente:

1. **Desarrollo local**: Haz cambios, commit y push a GitHub
2. **Los cambios se sincronizarán automáticamente** en Lovable
3. **Continúa el desarrollo** en cualquiera de las dos plataformas

### Verificar Sincronización
Para asegurarte de que los cambios se sincronizaron:
- Revisa el historial de commits en GitHub
- Verifica que los cambios aparezcan en Lovable

## 🔧 Edición del Código

### Opción 1: Usar Lovable (Recomendado)
Visita el [Proyecto en Lovable](https://lovable.dev/projects/4b7d258b-1fc6-4554-9241-57d2dcc5a5a6) y edita usando prompts de IA.

### Opción 2: IDE Local
Clona el repositorio y edita con tu IDE preferido. Los cambios se sincronizarán automáticamente.

### Opción 3: GitHub Codespaces
1. Ve al repositorio en GitHub
2. Click en "Code" → "Codespaces" → "New codespace"
3. Edita directamente en el navegador

### Opción 4: Edición Directa en GitHub
Edita archivos directamente en la interfaz web de GitHub.

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con:

### Frontend & Desarrollo
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Vite** - Herramienta de desarrollo y build
- **Tailwind CSS** - Framework de CSS utilitario
- **shadcn/ui** - Componentes de UI reutilizables
- **React Router** - Navegación del lado del cliente
- **TanStack Query** - Manejo de estado del servidor
- **Lucide React** - Iconos SVG optimizados

### Criptografía y Seguridad
- **@noble/ed25519** ^2.1.0 - Criptografía de curvas elípticas Ed25519
- **@noble/hashes** ^2.0.0 - Funciones hash criptográficas (SHAKE256, KDF)
- **dilithium-crystals** ^1.0.6 - Librería WASM para firmas CRYSTALS-Dilithium2
- **multiformats** ^13.4.0 - Codificación multibase para DID:key

## 🔐 Características Criptográficas

### Algoritmos Implementados

#### **QRNG vs PRNG**
- **Simulación** de generadores cuánticos vs pseudoaleatorios
- Comparación de distribuciones y patrones de aleatoriedad
- Visualización de diferencias en calidad entrópica

#### **Ed25519 (Clásico)**
- Criptografía de curvas elípticas tradicional
- 32 bytes seed → 32B clave privada + 32B clave pública
- Firmas de 64 bytes, verificación rápida

#### **CRYSTALS-Dilithium2 (Post-Cuántico)**
- **ML-DSA-44** - Resistente a computación cuántica
- 32 bytes seed → 4864B clave privada + 2592B clave pública  
- Firmas ~2420 bytes, seguridad nivel NIST 2
- **Determinístico**: Misma semilla → mismas claves siempre

#### **DID:key Experimental**
- Identificadores descentralizados para claves Dilithium2
- Formato: `did:key:z...` con multicodec experimental (0x12,0x34)
- Codificación multibase automática
- Compatible con estándares W3C (pendiente registro oficial)

#### **FROST (Simulado)**
- Firmas distribuidas entre múltiples participantes
- Threshold signatures (t-of-n)
- **Nota**: Solo simulación para demostración

## 🧪 Tests Automáticos

La aplicación incluye tests automáticos que se ejecutan en la UI:

### **Test 1: Determinismo (T1)**
- Verifica que la misma semilla genera las mismas claves
- Ejecuta generación múltiple con semilla fija
- ✅ Éxito: Claves idénticas en todas las iteraciones

### **Test 2: Firma/Verificación (T2)**  
- Ciclo completo: sign(mensaje, clave_privada) → verify(firma, mensaje, clave_pública)
- Valida integridad del proceso criptográfico
- ✅ Éxito: verify() retorna true

### **Test 3: DID:key (T3)**
- Genera DID:key válido para clave pública Dilithium2
- Verifica formato: `did:key:z[multibase_encoding]`
- ✅ Éxito: Formato correcto con prefijo experimental

### **Test 4: Export/Import (T4)**
- Serialización JSON de identidades criptográficas
- Persistencia con `algorithmType: "Dilithium2"`
- ✅ Éxito: Roundtrip sin pérdida de datos

### **Logging**
Todos los tests son visibles en la **consola del navegador** con logs detallados:
```
🔧 Test T1: Determinismo... ✅ ÉXITO
🔧 Test T2: Firma/Verificación... ✅ ÉXITO  
🔧 Test T3: DID:key... ✅ ÉXITO
🔧 Test T4: Export/Import... ✅ ÉXITO
```

## 🚀 Despliegue

### Opción 1: Lovable (Más Fácil)
1. Abre [Lovable](https://lovable.dev/projects/4b7d258b-1fc6-4554-9241-57d2dcc5a5a6)
2. Click en "Share" → "Publish"
3. Tu aplicación estará disponible con dominio `.lovable.app`

### Opción 2: Despliegue Manual
```bash
# Construir para producción
npm run build

# El directorio dist/ contiene los archivos estáticos listos para servir
# Sube estos archivos a cualquier hosting estático:
# - Netlify, Vercel, GitHub Pages, AWS S3, etc.
```

### Opción 3: Dominio Personalizado
1. En Lovable: Project → Settings → Domains → "Connect Domain"
2. Configura tu dominio personalizado
3. [Guía completa aquí](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## ⚠️ Advertencias de Seguridad

**Este es un PoC educativo con implementaciones experimentales**:

### **Limitaciones Generales**
- **QRNG y FROST** están simulados para demostración
- **NO usar en producción** sin implementaciones certificadas
- Solo para evaluación y aprendizaje de conceptos

### **Específicas de CRYSTALS-Dilithium2**
- ⚠️ **Multicodec experimental** (0x12,0x34) - NO oficial en registros W3C
- ⚠️ **ML-DSA-44** en proceso de estandarización NIST (no finalizada)
- ⚠️ **RNG determinístico** por limitaciones de `dilithium-crystals` v1.0.6
- ⚠️ **keyPairFromSeed** implementado con override temporal de `crypto.getRandomValues`

### **Recomendaciones para Producción**
- Migrar a multicodec oficial cuando esté disponible en registros W3C
- Usar implementaciones certificadas FIPS cuando ML-DSA-44 sea estándar
- Implementar `keyPairFromSeed` nativo cuando la librería lo soporte
- Conectar servicios QRNG reales (ANU Quantum, IBM Quantum, etc.)

## 📋 Roadmap Técnico

### **Fase 1: Estandarización (En Proceso)**
- [ ] **ML-DSA-44** - Finalización estándar NIST  
- [ ] **Multicodec oficial** - Registro en W3C para DID:key Dilithium
- [ ] **Certificación FIPS** - Implementaciones validadas

### **Fase 2: Implementación Nativa (Futuro)**
- [ ] **KeyPair nativo** - Soporte `keyPairFromSeed` en dilithium-crystals
- [ ] **FROST real** - Integración con implementación distribuida real
- [ ] **QRNG services** - Conectores con servicios cuánticos reales

### **Fase 3: Producción (Objetivo)**
- [ ] **Audit completo** - Revisión criptográfica independiente
- [ ] **HSM integration** - Soporte Hardware Security Modules
- [ ] **Enterprise features** - Backup/recovery, monitoreo, compliance

## 🐛 Debugging y Desarrollo

### **Logs en Consola del Navegador**
La aplicación incluye logging detallado:
```
🔧 Generando claves Dilithium2...
🔍 Validando tamaños de clave:
   Clave pública: 2592 bytes (esperado: 2592)
   Clave privada: 4864 bytes (esperado: 4864)
✅ Validación de tamaños exitosa
```

### **Tests Automáticos**
- Se ejecutan automáticamente al derivar claves
- Logs visibles en consola con prefijo `🔧 Test TX:`
- Status: ✅ ÉXITO / ❌ ERROR con descripción

### **Niveles de Logging**
- **🔧** Tests y validaciones
- **🔍** Debugging detallado  
- **⚠️** Warnings y limitaciones
- **❌** Errores críticos
- **✅** Operaciones exitosas

## 📞 Soporte

- [Documentación de Lovable](https://docs.lovable.dev/)
- [Comunidad Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Tutorial YouTube](https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO)
