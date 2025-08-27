import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdentityRecord } from "@/services/identityStorage";

interface EditNameModalProps {
  identity: IdentityRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, name: string) => void;
}

export function EditNameModal({ identity, open, onOpenChange, onSave }: EditNameModalProps) {
  const [name, setName] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && identity) {
      setName(identity.customName || "");
    }
    onOpenChange(newOpen);
  };

  const handleSave = () => {
    if (identity) {
      onSave(identity.id, name.trim());
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  if (!identity) return null;

  const truncatedDID = `${identity.didKey.substring(0, 30)}...${identity.didKey.substring(identity.didKey.length - 10)}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar nombre de identidad</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identity-name">Nombre personalizado</Label>
            <Input
              id="identity-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ingresa un nombre para esta identidad"
              maxLength={50}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Máximo 50 caracteres. Deja vacío para "Sin nombre".
            </p>
          </div>

          <div className="p-3 bg-muted/30 rounded-md border">
            <p className="text-xs text-muted-foreground mb-1">DID asociado:</p>
            <code className="text-xs font-mono text-muted-foreground break-all">
              {truncatedDID}
            </code>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}