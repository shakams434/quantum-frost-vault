import { Key, Users, BarChart3, Wallet } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const items = [
  { 
    title: "Onboarding & Claves", 
    url: "/", 
    icon: Key,
    description: "Generación PRNG vs QRNG" 
  },
  { 
    title: "Gestión de Identidades", 
    url: "/identidades", 
    icon: Wallet,
    description: "Mis claves y DIDs" 
  },
  { 
    title: "Firma Distribuida FROST", 
    url: "/frost", 
    icon: Users,
    description: "Esquema 2-de-3" 
  },
  { 
    title: "Métricas & Reporte", 
    url: "/metricas", 
    icon: BarChart3,
    description: "Análisis y resultados" 
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          {state === "expanded" && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">PoC Custodia</h2>
              <p className="text-sm text-sidebar-foreground/70">QRNG + FROST + VC</p>
            </div>
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && (
                        <div className="flex flex-col">
                          <span className="text-sm">{item.title}</span>
                          <span className="text-xs text-sidebar-foreground/60">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
