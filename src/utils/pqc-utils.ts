// src/utils/pqc-utils.ts
import { base58btc } from "multiformats/bases/base58";
import { shake256 } from "@noble/hashes/sha3";

export const toHex = (u8: Uint8Array): string =>
  [...u8].map(b => b.toString(16).padStart(2, "0")).join("");

export const fromHex = (hex: string): Uint8Array =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map(h => parseInt(h, 16)));

export const toBase64 = (u8: Uint8Array): string =>
  typeof window !== "undefined"
    ? btoa(String.fromCharCode(...u8))
    : Buffer.from(u8).toString("base64");

export const fromBase64 = (b64: string): Uint8Array =>
  typeof window !== "undefined"
    ? new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)))
    : new Uint8Array(Buffer.from(b64, 'base64'));

/**
 * KDF: Expande una semilla de 32 bytes a outLen bytes usando SHAKE256 (determinista)
 * @param seed32 - Semilla de exactamente 32 bytes
 * @param outLen - Longitud de salida deseada en bytes
 * @param domain - Etiqueta de dominio para separación (ej: "DILITHIUM2-KEYGEN")
 * @returns Uint8Array determinístico de outLen bytes
 */
export function kdfShake256(seed32: Uint8Array, outLen: number, domain: string): Uint8Array {
  if (seed32.length !== 32) {
    throw new Error("seed debe ser exactamente 32 bytes");
  }
  
  const hasher = shake256.create({ dkLen: outLen });
  hasher.update(seed32);
  hasher.update(new TextEncoder().encode(domain)); // Separación de dominio
  
  const output = new Uint8Array(outLen);
  hasher.digestInto(output);
  return output;
}

/**
 * Construye un DID:key experimental para Dilithium2
 * TODO: Migrar a multicodec oficial cuando esté disponible en W3C DID spec registries
 * Tracking: https://github.com/w3c/did-spec-registries/issues/184
 * @param publicKey - Clave pública de Dilithium2
 * @returns Objeto con did, multibase y verificationMethodId
 */
export function didKeyDilithium(publicKey: Uint8Array) {
  // EXPERIMENTAL: Multicodec temporal para dilithium2-pub
  // Este valor es temporal hasta que se defina el multicodec oficial
  const DILITHIUM2_MULTICODEC = new Uint8Array([0x12, 0x34]);
  
  const payload = new Uint8Array(DILITHIUM2_MULTICODEC.length + publicKey.length);
  payload.set(DILITHIUM2_MULTICODEC, 0);
  payload.set(publicKey, DILITHIUM2_MULTICODEC.length);
  
  const multibase = "z" + base58btc.encode(payload);
  const did = `did:key:${multibase}`;
  
  return {
    did,
    multibase,
    verificationMethodId: `${did}#${multibase}`
  };
}

/**
 * Genera un RNG determinístico basado en una semilla
 * Útil cuando la librería no soporta keyPairFromSeed pero acepta RNG personalizado
 */
export function createDeterministicRNG(seed32: Uint8Array, domain: string) {
  let offset = 0;
  let pool = kdfShake256(seed32, 4096, domain);
  
  return (length: number): Uint8Array => {
    // Expandir pool si es necesario
    if (offset + length > pool.length) {
      const expandedPool = kdfShake256(seed32, pool.length * 2, `${domain}-EXPAND-${offset}`);
      const newPool = new Uint8Array(pool.length + expandedPool.length);
      newPool.set(pool, 0);
      newPool.set(expandedPool, pool.length);
      pool = newPool;
    }
    
    const result = pool.subarray(offset, offset + length);
    offset += length;
    return result;
  };
}

/**
 * Compara dos Uint8Arrays de forma constante en tiempo
 */
export function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}