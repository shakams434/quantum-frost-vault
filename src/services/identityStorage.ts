// src/services/identityStorage.ts
export interface IdentityRecord {
  id: string;
  customName?: string;
  didKey: string;
  seed: string;
  privateKey: string;
  publicKey: string;
  multibase: string;
  vmId: string;
  createdAt: string;
  generationType: 'QRNG' | 'PRNG';
  algorithmType?: 'Ed25519' | 'Dilithium2';
}

const STORAGE_KEY = 'poc-custodia-identities';

export const identityStorage = {
  saveIdentity(identity: Omit<IdentityRecord, 'id'>): string {
    const newIdentity: IdentityRecord = {
      ...identity,
      id: crypto.randomUUID(),
    };

    const existing = this.getAllIdentities();
    const updated = [...existing, newIdentity];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    return newIdentity.id;
  },

  getAllIdentities(): IdentityRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading identities:', error);
      return [];
    }
  },

  updateIdentityName(id: string, customName: string): boolean {
    try {
      const identities = this.getAllIdentities();
      const index = identities.findIndex(i => i.id === id);
      
      if (index === -1) return false;
      
      identities[index].customName = customName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identities));
      return true;
    } catch (error) {
      console.error('Error updating identity name:', error);
      return false;
    }
  },

  deleteIdentity(id: string): boolean {
    try {
      const identities = this.getAllIdentities();
      const filtered = identities.filter(i => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting identity:', error);
      return false;
    }
  },

  exportIdentity(id: string): string | null {
    try {
      const identities = this.getAllIdentities();
      const identity = identities.find(i => i.id === id);
      
      if (!identity) return null;
      
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        identity
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting identity:', error);
      return null;
    }
  },

  exportAllIdentities(): string {
    try {
      const identities = this.getAllIdentities();
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        identities
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting all identities:', error);
      return JSON.stringify({ identities: [] });
    }
  },

  importIdentities(jsonData: string): { success: number, errors: string[] } {
    try {
      const parsed = JSON.parse(jsonData);
      const errors: string[] = [];
      let success = 0;

      // Handle both single identity and batch export formats
      const identities = parsed.identity ? [parsed.identity] : (parsed.identities || []);
      
      if (!Array.isArray(identities)) {
        return { success: 0, errors: ['Formato de archivo inválido'] };
      }

      const existing = this.getAllIdentities();
      const existingDIDs = new Set(existing.map(i => i.didKey));

      for (const identity of identities) {
        try {
          // Validate required fields
          if (!identity.didKey || !identity.seed || !identity.privateKey || !identity.publicKey) {
            errors.push(`Identidad inválida: faltan campos requeridos`);
            continue;
          }

          // Check for duplicates
          if (existingDIDs.has(identity.didKey)) {
            errors.push(`DID duplicado: ${identity.didKey.substring(0, 20)}...`);
            continue;
          }

          // Create new identity with fresh ID
          const newIdentity: IdentityRecord = {
            id: crypto.randomUUID(),
            customName: identity.customName,
            didKey: identity.didKey,
            seed: identity.seed,
            privateKey: identity.privateKey,
            publicKey: identity.publicKey,
            multibase: identity.multibase || identity.didKey.split(':')[2],
            vmId: identity.vmId || `${identity.didKey}#${identity.didKey.split(':')[2]}`,
            createdAt: identity.createdAt || new Date().toISOString(),
            generationType: identity.generationType || 'PRNG'
          };

          existing.push(newIdentity);
          existingDIDs.add(newIdentity.didKey);
          success++;
        } catch (error) {
          errors.push(`Error procesando identidad: ${error}`);
        }
      }

      if (success > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      }

      return { success, errors };
    } catch (error) {
      return { success: 0, errors: ['Error al procesar el archivo JSON'] };
    }
  }
};