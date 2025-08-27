import { useState } from "react";
import { Eye, Edit3, Trash2, Download, Copy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { IdentityRecord } from "@/services/identityStorage";

interface IdentityCardProps {
  identity: IdentityRecord;
  onViewDetails: (identity: IdentityRecord) => void;
  onEdit: (identity: IdentityRecord) => void;
  onDelete: (identity: IdentityRecord) => void;
  onExport: (identity: IdentityRecord) => void;
}

export function IdentityCard({ identity, onViewDetails, onEdit, onDelete, onExport }: IdentityCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const copyDID = async () => {
    try {
      await navigator.clipboard.writeText(identity.didKey);
      toast({
        title: "Copiado",
        description: "DID copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el DID",
        variant: "destructive",
      });
    }
  };

  const displayName = identity.customName || "Sin nombre";
  const truncatedDID = `${identity.didKey.substring(0, 25)}...${identity.didKey.substring(identity.didKey.length - 8)}`;

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {displayName}
                  </h3>
                  {!identity.customName && (
                    <Edit3 className="h-3 w-3 text-muted-foreground opacity-50" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs break-all">
                <p className="text-xs">{identity.didKey}</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={identity.generationType === 'QRNG' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {identity.generationType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(identity.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
            <code className="text-xs text-muted-foreground font-mono flex-1 truncate">
              {truncatedDID}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                copyDID();
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          <div className={`grid grid-cols-4 gap-1 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(identity);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(identity);
              }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onExport(identity);
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(identity);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}