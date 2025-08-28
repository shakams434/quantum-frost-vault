// src/pqc/dilithium2.ts
import { kdfShake256, createDeterministicRNG } from "@/utils/pqc-utils";

// Tipos para la interfaz de dilithium-crystals
interface DilithiumKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * Genera un par de claves Dilithium2 de forma determinística desde una semilla de 32 bytes
 * 
 * IMPLEMENTACIÓN: Como dilithium-crystals v1.0.6 no soporta keyPairFromSeed directamente,
 * usamos KDF SHAKE256 para generar un RNG determinístico que alimente keyPair()
 * 
 * TODO: Migrar a keyPairFromSeed() si la librería lo implementa en futuras versiones
 * 
 * @param seed32 - Semilla de exactamente 32 bytes
 * @returns Promise<DilithiumKeyPair> - Par de claves determinístico
 */
export async function keypairFromSeed(seed32: Uint8Array): Promise<DilithiumKeyPair> {
  if (seed32.length !== 32) {
    throw new Error("La semilla debe ser exactamente de 32 bytes");
  }

  try {
    // Carga diferida del módulo WASM
    const dilithiumModule = await import('dilithium-crystals');
    
    // Acceder a la API correcta de dilithium-crystals
    const dilithium = dilithiumModule.dilithium;
    
    // MÉTODO 1: keyPairFromSeed no existe en dilithium-crystals v1.0.6
    // La librería solo tiene keyPair() que no acepta parámetros
    
    // MÉTODO 2: RNG determinístico (implementación actual)
    console.log('⚠️ Usando RNG determinístico - keyPairFromSeed no disponible');
    
    // Crear RNG determinístico
    const deterministicRNG = createDeterministicRNG(seed32, "DILITHIUM2-RNG");
    
    // Sobrescribir crypto.getRandomValues temporalmente
    const originalGetRandomValues = crypto.getRandomValues;
    let rngCallCount = 0;
    
    crypto.getRandomValues = (array: any) => {
      const randomBytes = deterministicRNG(array.length);
      array.set(randomBytes);
      rngCallCount++;
      return array;
    };
    
    try {
      // Generar par de claves con RNG determinístico
      const keyPair = await dilithium.keyPair();
      console.log(`🔧 RNG calls interceptadas: ${rngCallCount}`);
      
      return {
        publicKey: keyPair.publicKey,
        secretKey: keyPair.privateKey  // dilithium-crystals usa 'privateKey', no 'secretKey'
      };
    } finally {
      // Restaurar crypto.getRandomValues original
      crypto.getRandomValues = originalGetRandomValues;
    }
    
  } catch (error) {
    console.error('❌ Error generando par de claves Dilithium2:', error);
    throw new Error(`Fallo en generación de claves Dilithium2: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Valida que un par de claves sea válido
 */
export function validateKeyPair(publicKey: Uint8Array, secretKey: Uint8Array): boolean {
  // Dilithium2 (ML-DSA-44) tamaños esperados según NIST
  const EXPECTED_PUBLIC_KEY_SIZE = 1312;  // bytes
  const EXPECTED_SECRET_KEY_SIZE = 2528;  // bytes
  
  if (publicKey.length !== EXPECTED_PUBLIC_KEY_SIZE) {
    console.warn(`⚠️ Tamaño de clave pública inesperado: ${publicKey.length}, esperado: ${EXPECTED_PUBLIC_KEY_SIZE}`);
    return false;
  }
  
  if (secretKey.length !== EXPECTED_SECRET_KEY_SIZE) {
    console.warn(`⚠️ Tamaño de clave privada inesperado: ${secretKey.length}, esperado: ${EXPECTED_SECRET_KEY_SIZE}`);
    return false;
  }
  
  return true;
}

/**
 * Obtiene información sobre los tamaños de clave Dilithium2
 */
export function getDilithiumKeyInfo() {
  return {
    algorithm: "CRYSTALS-Dilithium2 (ML-DSA-44)",
    publicKeySize: 1312,  // bytes
    secretKeySize: 2528,  // bytes
    signatureSize: 2420,  // bytes (aproximado)
    securityLevel: "NIST Level 2 (equivalent to AES-128)",
    quantumResistant: true,
    experimental: true
  };
}