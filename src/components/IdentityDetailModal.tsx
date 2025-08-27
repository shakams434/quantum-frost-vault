import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { IdentityRecord } from "@/services/identityStorage";

interface IdentityDetailModalProps {
  identity: IdentityRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdentityDetailModal({ identity, open, onOpenChange }: IdentityDetailModalProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showSeed, setShowSeed] = useState(false);

  if (!identity) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `${label} copiado al portapapeles`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo copiar ${label.toLowerCase()}`,
        variant: "destructive",
      });
    }
  };

  const formatHexWithSpaces = (hex: string) => {
    return hex.match(/.{1,8}/g)?.join(' ') || hex;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const DataField = ({ 
    label, 
    value, 
    copyValue, 
    isSecret = false, 
    showSecret = false, 
    onToggleSecret 
  }: {
    label: string;
    value: string;
    copyValue?: string;
    isSecret?: boolean;
    showSecret?: boolean;
    onToggleSecret?: () => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-2">
          {isSecret && onToggleSecret && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggleSecret}
            >
              {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => copyToClipboard(copyValue || value, label)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-3 bg-muted/30 rounded-md border">
        <code className="text-xs font-mono break-all text-muted-foreground">
          {isSecret && !showSecret ? '•'.repeat(32) : value}
        </code>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{identity.customName || "Identidad sin nombre"}</span>
            <Badge variant={identity.generationType === 'QRNG' ? 'default' : 'secondary'}>
              {identity.generationType}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Información General</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Fecha de creación:</span>
                <p className="font-medium">{formatDate(identity.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo de generación:</span>
                <p className="font-medium">{identity.generationType}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* DID y Verification Method */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Identificadores Descentralizados</h4>
            
            <DataField
              label="DID Completo"
              value={identity.didKey}
            />

            <DataField
              label="Multibase (z...)"
              value={identity.multibase}
            />

            <DataField
              label="Verification Method ID"
              value={identity.vmId}
            />
          </div>

          <Separator />

          {/* Material criptográfico */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Material Criptográfico</h4>
            
            <DataField
              label="Semilla (Seed)"
              value={formatHexWithSpaces(identity.seed)}
              copyValue={identity.seed}
              isSecret
              showSecret={showSeed}
              onToggleSecret={() => setShowSeed(!showSeed)}
            />

            <DataField
              label="Clave Privada (Hex)"
              value={formatHexWithSpaces(identity.privateKey)}
              copyValue={identity.privateKey}
              isSecret
              showSecret={showPrivateKey}
              onToggleSecret={() => setShowPrivateKey(!showPrivateKey)}
            />

            <DataField
              label="Clave Pública (Hex)"
              value={formatHexWithSpaces(identity.publicKey)}
              copyValue={identity.publicKey}
            />
          </div>

          {/* Advertencia de seguridad */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-start gap-2">
              <div className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Información sensible
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  La semilla y clave privada son datos extremadamente sensibles. 
                  Mantén esta información segura y nunca la compartas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}