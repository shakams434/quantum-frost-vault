# PoC – Custodia de Llaves con QRNG, FROST y VC

Demo ejecutiva para evaluación de tecnologías de seguridad avanzada que incluye simulaciones de Generación de Números Aleatorios Cuánticos (QRNG), firmas distribuidas FROST y manejo de credenciales verificables.

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
│   ├── Onboarding.tsx  # Simulación QRNG vs PRNG
│   ├── FROST.tsx       # Firma distribuida FROST
│   ├── Metricas.tsx    # Dashboard de métricas
│   └── NotFound.tsx    # Página 404
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuración
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

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Vite** - Herramienta de desarrollo y build
- **Tailwind CSS** - Framework de CSS utilitario
- **shadcn/ui** - Componentes de UI reutilizables
- **React Router** - Navegación del lado del cliente
- **TanStack Query** - Manejo de estado del servidor
- **Lucide React** - Iconos SVG optimizados

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

## ⚠️ Importante

**Este es un PoC educativo con simulaciones**:
- QRNG y FROST están simulados para demostración
- **NO usar en producción** sin implementaciones reales
- Solo para evaluación y aprendizaje de conceptos

## 📞 Soporte

- [Documentación de Lovable](https://docs.lovable.dev/)
- [Comunidad Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Tutorial YouTube](https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO)
