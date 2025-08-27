import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import FloatingChatWidget from "@/components/FloatingChatWidget"
import { ReactNode } from "react"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  console.log("Layout component rendering");
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center border-b border-border/50 bg-card/80 backdrop-blur-sm px-6 shadow-card">
            <SidebarTrigger className="mr-4 transition-smooth hover:shadow-glow" />
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Custodia de Llaves con QRNG, FROST y VC
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Sistema de seguridad avanzada para gestión de identidades
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Sistema Activo</span>
            </div>
          </header>
          
          <main className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/30">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          
          <footer className="border-t border-border/50 bg-card/80 backdrop-blur-sm p-4">
            <div className="max-w-7xl mx-auto">
              <p className="text-xs text-muted-foreground text-center">
                🔒 <strong>Sistema Seguro:</strong> Tecnología de última generación para protección de datos críticos
              </p>
            </div>
          </footer>
        </div>
      </div>
      <FloatingChatWidget />
    </SidebarProvider>
  )
}