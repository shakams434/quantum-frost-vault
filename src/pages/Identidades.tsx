import { useState, useEffect } from "react";
import { Wallet, Plus, Upload, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IdentityCard } from "@/components/IdentityCard";
import { IdentityDetailModal } from "@/components/IdentityDetailModal";
import { EditNameModal } from "@/components/EditNameModal";
import { ImportModal } from "@/components/ImportModal";
import { identityStorage, IdentityRecord } from "@/services/identityStorage";
import { Link } from "react-router-dom";

export default function Identidades() {
  const [identities, setIdentities] = useState<IdentityRecord[]>([]);
  const [filteredIdentities, setFilteredIdentities] = useState<IdentityRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIdentity, setSelectedIdentity] = useState<IdentityRecord | null>(null);
  const [identityToEdit, setIdentityToEdit] = useState<IdentityRecord | null>(null);
  const [identityToDelete, setIdentityToDelete] = useState<IdentityRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadIdentities();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredIdentities(identities);
    } else {
      const filtered = identities.filter(identity => 
        (identity.customName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        identity.didKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        identity.generationType.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIdentities(filtered);
    }
  }, [identities, searchTerm]);

  const loadIdentities = () => {
    const loaded = identityStorage.getAllIdentities();
    // Sort by creation date, newest first
    loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setIdentities(loaded);
  };

  const handleViewDetails = (identity: IdentityRecord) => {
    setSelectedIdentity(identity);
    setShowDetailModal(true);
  };

  const handleEdit = (identity: IdentityRecord) => {
    setIdentityToEdit(identity);
    setShowEditModal(true);
  };

  const handleSaveName = (id: string, name: string) => {
    const success = identityStorage.updateIdentityName(id, name);
    if (success) {
      loadIdentities();
      toast({
        title: "Nombre actualizado",
        description: "El nombre de la identidad se ha actualizado correctamente",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre de la identidad",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (identity: IdentityRecord) => {
    setIdentityToDelete(identity);
  };

  const confirmDelete = () => {
    if (identityToDelete) {
      const success = identityStorage.deleteIdentity(identityToDelete.id);
      if (success) {
        loadIdentities();
        toast({
          title: "Identidad eliminada",
          description: "La identidad se ha eliminado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar la identidad",
          variant: "destructive",
        });
      }
      setIdentityToDelete(null);
    }
  };

  const handleExport = (identity: IdentityRecord) => {
    const exported = identityStorage.exportIdentity(identity.id);
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `identity-${identity.customName || 'unnamed'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Identidad exportada",
        description: "La identidad se ha exportado correctamente",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo exportar la identidad",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = () => {
    const exported = identityStorage.exportAllIdentities();
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-identities-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Identidades exportadas",
      description: `${identities.length} identidades exportadas correctamente`,
    });
  };

  const handleImport = async (jsonData: string) => {
    const result = identityStorage.importIdentities(jsonData);
    
    if (result.success > 0) {
      loadIdentities();
    }

    return result;
  };

  if (identities.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Gestión de Identidades</h1>
            <p className="text-muted-foreground">
              Aún no tienes identidades guardadas. Crea tu primera identidad desde el módulo de Onboarding.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <Plus className="h-4 w-4 mr-2" />
                Crear nueva identidad
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar identidades
            </Button>
          </div>

          <div className="p-6 bg-muted/30 rounded-lg border">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>💡 Tip:</strong> Las identidades se guardan automáticamente cuando las generas en Onboarding.</p>
              <p><strong>🔒 Seguridad:</strong> Toda la información se almacena localmente en tu navegador.</p>
            </div>
          </div>
        </div>

        <ImportModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onImport={handleImport}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Gestión de Identidades
          </h1>
          <p className="text-muted-foreground">
            {identities.length} identidad{identities.length !== 1 ? 'es' : ''} guardada{identities.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Exportar todas
          </Button>
          <Button asChild>
            <Link to="/">
              <Plus className="h-4 w-4 mr-2" />
              Nueva identidad
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, DID o tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid de identidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredIdentities.map((identity) => (
          <IdentityCard
            key={identity.id}
            identity={identity}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        ))}
      </div>

      {filteredIdentities.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No se encontraron identidades que coincidan con "{searchTerm}"
          </p>
        </div>
      )}

      {/* Modals */}
      <IdentityDetailModal
        identity={selectedIdentity}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />

      <EditNameModal
        identity={identityToEdit}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleSaveName}
      />

      <ImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={handleImport}
      />

      {/* Confirm delete dialog */}
      <AlertDialog open={!!identityToDelete} onOpenChange={() => setIdentityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar identidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la identidad 
              "{identityToDelete?.customName || 'sin nombre'}" y toda su información criptográfica.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}