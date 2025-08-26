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
          <header className="h-14 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                PoC – Custodia de Llaves con QRNG, FROST y VC
              </h1>
              <p className="text-sm text-muted-foreground">
                Demo ejecutiva para evaluación de tecnologías de seguridad
              </p>
            </div>
          </header>
          
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
          
          <footer className="border-t border-border bg-card p-4">
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ <strong>Disclaimer:</strong> PoC educativa. QRNG y FROST simulados. No usar en producción.
            </p>
          </footer>
        </div>
      </div>
      <FloatingChatWidget />
    </SidebarProvider>
  )
}